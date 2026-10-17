import express, { Express } from 'express';
import { createServeSpa } from './handlers/serveSpa';
import type { OfficialVacationsSource } from './ports/OfficialVacationsSource';
import type { ParametersRepository } from './ports/ParametersRepository';
import { createApiRouter } from './routes/apiRouter';

export interface AppDependencies {
  clientDist: string;
  officialVacations: OfficialVacationsSource;
  parameters: ParametersRepository;
}

export function createApp({ clientDist, officialVacations, parameters }: AppDependencies): Express {
  const app = express();

  app.use(express.static(clientDist));
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', createApiRouter({ officialVacations, parameters }));
  app.get('*', createServeSpa(clientDist));

  return app;
}
