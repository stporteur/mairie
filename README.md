# Portail Applicatif - Marie de L'Haÿ-les-Roses

Application Node.js + React pour le portail applicatif de la mairie, avec la première application `Planning ATSEM`.

Le planning calcule les heures de travail en période scolaire et en vacances, les jours fériés avec `jours-feries-fr`, les périodes de congés et RTT, et permet d'importer un fichier Excel de calendrier.

## Installation

1. Depuis le dossier racine du projet :
   ```bash
   npm install
   ```

2. En développement :
   ```bash
   npm run dev
   ```

3. Pour construire l'application :
   ```bash
   npm run build
   ```

4. Pour démarrer le serveur de production :
   ```bash
   npm start
   ```

## Service Windows et développement en parallèle

- **Service** (`MairiePortal`, démarrage automatique) : copie compilée dans `C:\mairie-app`, indépendante du dossier de développement.
  Installation ou mise à jour (demande les droits administrateur) :
  ```powershell
  powershell -File deploy\deploy.ps1 -Port 8080   # le port est mémorisé pour les mises à jour
  powershell -File deploy\deploy.ps1 -Uninstall
  ```
  URL : `http://mairie:8080` (le nom `mairie` est ajouté au fichier hosts). Configuration du service (base, port) : `C:\mairie-app\.env`
  (initialisée depuis `deploy\.env.service` si présent, sinon depuis `.env`, ou avec `-ResetConfig`). Logs : `C:\mairie-app\logs`.
- **Développement** (`npm run dev`) : API sur `PORT` (4000 par défaut) et Vite sur 5173. La base cible se règle dans le `.env` du projet
  (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) ; `npm run db:update` applique Liquibase sur cette même base.
