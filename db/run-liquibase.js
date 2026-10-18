// Runs Liquibase against the database configured in the root .env (DB_HOST, DB_PORT, DB_NAME,
// DB_USER, DB_PASSWORD), so that the target database is chosen in one place.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const { DB_HOST = 'localhost', DB_PORT = '5432', DB_NAME = 'mairie', DB_USER = 'mairie', DB_PASSWORD } = process.env;
const command = process.argv[2] || 'status';

const env = {
  ...process.env,
  LIQUIBASE_COMMAND_URL: `jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  LIQUIBASE_COMMAND_USERNAME: DB_USER,
};
if (DB_PASSWORD && !env.LIQUIBASE_COMMAND_PASSWORD) env.LIQUIBASE_COMMAND_PASSWORD = DB_PASSWORD;

console.log(`Liquibase ${command} sur ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
const result = spawnSync(
  'liquibase',
  ['--defaults-file=db/liquibase.properties', '--search-path=db', command],
  { cwd: root, env, stdio: 'inherit', shell: true },
);
process.exit(result.status ?? 1);
