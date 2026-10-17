import fs from 'fs';
import path from 'path';

/** Loads the git-ignored .env at the project root, without overriding real environment variables. */
export function loadEnvFile(file: string = path.resolve(__dirname, '..', '..', '.env')): void {
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
  }
}
