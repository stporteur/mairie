# Base de données (PostgreSQL + Liquibase)

- Base `mairie`, encodage UTF8, utilisateur `mairie`.
- Les migrations sont dans `changelog/migrations/`, appliquées par ordre alphabétique
  (nommer les fichiers `001-description.yaml`, `002-...`).

## Utilisation

Le mot de passe est fourni par variable d'environnement (ne jamais le commiter) :

```powershell
$env:LIQUIBASE_COMMAND_PASSWORD = '<mot de passe>'
npm run db:status
npm run db:update
```
