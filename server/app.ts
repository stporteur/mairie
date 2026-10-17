import express, { Express } from 'express';
import { createServeSpa } from './handlers/serveSpa';
import type { OfficialVacationsSource } from './ports/OfficialVacationsSource';
import { createApiRouter } from './routes/apiRouter';

export interface AppDependencies {
  clientDist: string;
  officialVacations: OfficialVacationsSource;
}

export function createApp({ clientDist, officialVacations }: AppDependencies): Express {
  const app = express();

  app.use(express.static(clientDist));
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', createApiRouter(officialVacations));
  app.get('*', createServeSpa(clientDist));

  return app;
}
