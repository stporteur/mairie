import express, { Express } from 'express';
import { createServeSpa } from './handlers/serveSpa';
import type { OfficialVacationsSource } from './ports/OfficialVacationsSource';
import type { ParametersRepository } from './ports/ParametersRepository';
import type { PlanningTypesRepository } from './ports/PlanningTypesRepository';
import type { VacationHistoryRepository } from './ports/VacationHistoryRepository';
import { createApiRouter } from './routes/apiRouter';

export interface AppDependencies {
  clientDist: string;
  officialVacations: OfficialVacationsSource;
  vacationHistory: VacationHistoryRepository;
  parameters: ParametersRepository;
  planningTypes: PlanningTypesRepository;
}

export function createApp({ clientDist, officialVacations, vacationHistory, parameters, planningTypes }: AppDependencies): Express {
  const app = express();

  app.use(express.static(clientDist));
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', createApiRouter({ officialVacations, vacationHistory, parameters, planningTypes }));
  app.get('*', createServeSpa(clientDist));

  return app;
}
