import path from 'path';
import { createApp } from './app';
import { createDataGouvOfficialVacationsSource } from './infrastructure/officialVacations/officialVacationsSources';

const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const app = createApp({
  clientDist: path.resolve(__dirname, '../client/dist'),
  officialVacations: createDataGouvOfficialVacationsSource(),
});

app.listen(port, () => {
  console.log(`Portail applicatif démarré sur http://localhost:${port}`);
});
