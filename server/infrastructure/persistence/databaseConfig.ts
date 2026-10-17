export interface DatabaseConfig {
  host: string;
  port: number;
  dbName: string;
  user: string;
  password: string;
}

/** Reads the connection settings from the environment; the password has no default. */
export function readDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const password = env.DB_PASSWORD;
  if (!password) {
    throw new Error('DB_PASSWORD is not set (see .env.example).');
  }
  return {
    host: env.DB_HOST ?? 'localhost',
    port: env.DB_PORT ? parseInt(env.DB_PORT, 10) : 5432,
    dbName: env.DB_NAME ?? 'mairie',
    user: env.DB_USER ?? 'mairie',
    password,
  };
}
