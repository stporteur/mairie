import path from 'path';
import { createApp } from './app';
import { loadEnvFile } from './infrastructure/loadEnvFile';
import { createDataGouvOfficialVacationsSource } from './infrastructure/officialVacations/officialVacationsSources';
import { createOrm } from './infrastructure/persistence/createOrm';
import { MikroOrmParametersRepository } from './infrastructure/persistence/MikroOrmParametersRepository';
import { MikroOrmPlanningTypesRepository } from './infrastructure/persistence/MikroOrmPlanningTypesRepository';
import { MikroOrmVacationHistoryRepository } from './infrastructure/persistence/MikroOrmVacationHistoryRepository';

const DEFAULT_PORT = 4000;

async function main(): Promise<void> {
  loadEnvFile();
  const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
  const orm = await createOrm();

  const app = createApp({
    clientDist: path.resolve(__dirname, '../client/dist'),
    officialVacations: createDataGouvOfficialVacationsSource(),
    vacationHistory: new MikroOrmVacationHistoryRepository(orm),
    parameters: new MikroOrmParametersRepository(orm),
    planningTypes: new MikroOrmPlanningTypesRepository(orm),
  });

  const server = app.listen(port, () => {
    console.log(`Portail applicatif démarré sur http://localhost:${port}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      void orm.close().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
