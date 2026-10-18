<#
.SYNOPSIS
  Installe ou met à jour le portail comme service Windows, séparé du dossier de développement.
.DESCRIPTION
  - compile le serveur et le client dans -InstallDir (copie indépendante du code de VS Code) ;
  - lit la configuration du service dans deploy\.env.service (sinon dans le .env du projet) ;
  - installe/redémarre le service « MairiePortal » (WinSW) ;
  - déclare le nom « mairie » dans le fichier hosts → http://mairie:<PORT>.
  Les droits administrateur sont demandés automatiquement (UAC).
.EXAMPLE
  powershell -File deploy\deploy.ps1 -Port 8080
  powershell -File deploy\deploy.ps1 -Uninstall
#>
param(
  [int]$Port = 0,
  [string]$InstallDir = 'C:\mairie-app',
  [string]$HostName = 'mairie',
  [switch]$ResetConfig,
  [switch]$Uninstall
)

$ErrorActionPreference = 'Continue' # npm/tsc write to stderr; failures are checked with $LASTEXITCODE
$repo = Split-Path $PSScriptRoot -Parent
$serviceId = 'MairiePortal'
$winswUrl = 'https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe'
$winsw = Join-Path $InstallDir 'MairiePortal.exe'
$logFile = Join-Path $PSScriptRoot 'deploy.log'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-Port', $Port, '-InstallDir', "`"$InstallDir`"", '-HostName', $HostName)
  if ($ResetConfig) { $arguments += '-ResetConfig' }
  if ($Uninstall) { $arguments += '-Uninstall' }
  Start-Process powershell -Verb RunAs -Wait -ArgumentList $arguments
  if (Test-Path $logFile) { Get-Content $logFile }
  return
}

Start-Transcript -Path $logFile -Force | Out-Null
try {
  function Get-ServiceExists { [bool](Get-Service -Name $serviceId -ErrorAction SilentlyContinue) }

  function Stop-PortalService {
    if (Get-ServiceExists) {
      Stop-Service -Name $serviceId -Force -ErrorAction SilentlyContinue
      (Get-Service -Name $serviceId).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(30))
    }
  }

  if ($Uninstall) {
    Stop-PortalService
    if (Get-ServiceExists) { & $winsw uninstall }
    Write-Host "Service $serviceId désinstallé (le dossier $InstallDir est conservé)."
    return
  }

  # Configuration du service : fichier dédié, sinon .env du projet.
  $envTarget = Join-Path $InstallDir '.env'
  if ($ResetConfig -or -not (Test-Path $envTarget)) {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    $source = Join-Path $PSScriptRoot '.env.service'
    if (-not (Test-Path $source)) { $source = Join-Path $repo '.env' }
    if (-not (Test-Path $source)) { throw 'Aucune configuration trouvée (deploy\.env.service ou .env).' }
    Copy-Item $source $envTarget -Force
  }
  $lines = @(Get-Content $envTarget | Where-Object { $_ -notmatch '^\s*PORT=' })
  if ($Port -le 0) {
    $previous = Get-Content (Join-Path $InstallDir 'port.txt') -ErrorAction SilentlyContinue
    $Port = if ($previous) { [int]$previous } else { 8080 }
  }
  Set-Content -Path $envTarget -Value ($lines + "PORT=$Port") -Encoding ASCII
  Set-Content -Path (Join-Path $InstallDir 'port.txt') -Value $Port -Encoding ASCII

  Stop-PortalService

  Push-Location $repo
  try {
    Write-Host '== Build du client'
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Build du client en échec.' }

    Write-Host '== Compilation du serveur'
    Remove-Item -Recurse -Force (Join-Path $InstallDir 'server'), (Join-Path $InstallDir 'shared') -ErrorAction SilentlyContinue
    npx tsc -p server/tsconfig.json --outDir $InstallDir
    if ($LASTEXITCODE -ne 0) { throw 'Compilation du serveur en échec.' }

    Write-Host '== Copie des modèles Excel'
    $templateTarget = Join-Path $InstallDir 'server\template'
    New-Item -ItemType Directory -Force -Path $templateTarget | Out-Null
    Copy-Item (Join-Path $repo 'server\template\*') $templateTarget -Recurse -Force

    Write-Host '== Copie du client'
    $clientTarget = Join-Path $InstallDir 'client\dist'
    Remove-Item -Recurse -Force $clientTarget -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $clientTarget | Out-Null
    Copy-Item (Join-Path $repo 'client\dist\*') $clientTarget -Recurse -Force

    Write-Host '== Dépendances de production'
    Copy-Item package.json, package-lock.json $InstallDir -Force
  } finally {
    Pop-Location
  }
  Push-Location $InstallDir
  try {
    npm ci --omit=dev --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw 'Installation des dépendances en échec.' }
  } finally {
    Pop-Location
  }

  Write-Host '== Service Windows'
  New-Item -ItemType Directory -Force -Path (Join-Path $InstallDir 'logs') | Out-Null
  if (-not (Test-Path $winsw)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $winswUrl -OutFile $winsw -UseBasicParsing -ErrorAction Stop
  }
  $node = (Get-Command node).Source
  (Get-Content (Join-Path $PSScriptRoot 'mairie-service.xml') -Raw).Replace('__NODE__', $node).Replace('__INSTALL_DIR__', $InstallDir) |
    Set-Content -Path (Join-Path $InstallDir 'MairiePortal.xml') -Encoding UTF8
  if (-not (Get-ServiceExists)) { & $winsw install; if ($LASTEXITCODE -ne 0) { throw 'Installation du service en échec.' } }
  Start-Service -Name $serviceId -ErrorAction Stop

  Write-Host "== Nom d'hôte $HostName"
  $hosts = Join-Path $env:windir 'System32\drivers\etc\hosts'
  if (-not (Select-String -Path $hosts -Pattern "^\s*127\.0\.0\.1\s+$HostName(\s|$)" -Quiet)) {
    Add-Content -Path $hosts -Value "127.0.0.1`t$HostName"
  }

  Start-Sleep -Seconds 5
  $status = (Invoke-WebRequest -Uri "http://${HostName}:$Port/api/status" -UseBasicParsing -ErrorAction Stop).StatusCode
  Write-Host "Service $serviceId : $((Get-Service $serviceId).Status) ; http://${HostName}:$Port/api/status -> $status"
  Write-Host "Application : http://${HostName}:$Port"
} catch {
  Write-Host "ERREUR : $_"
  exit 1
} finally {
  Stop-Transcript | Out-Null
}
