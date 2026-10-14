import path from 'path';
import express, { Express, Request, Response } from 'express';
import { getOfficialVacations } from './officialHolidays';

const app: Express = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const clientDist: string = path.resolve(__dirname, '../client/dist');

interface VacationPeriod {
  name: string;
  start: string;
  end: string;
}

interface VacationsByYear {
  [year: number]: VacationPeriod[];
}

interface ApiResponse {
  year: number;
  zone: string;
  vacations: VacationPeriod[];
  source: any;
}

const vacationsByYear: VacationsByYear = {
  2026: [
    { name: 'Noël fin d\'année', start: '2026-01-01', end: '2026-01-05' },
    { name: 'Vacances d\'hiver', start: '2026-02-21', end: '2026-03-09' },
    { name: 'Vacances de printemps', start: '2026-04-11', end: '2026-04-27' },
    { name: 'Grandes vacances', start: '2026-07-04', end: '2026-08-31' },
    { name: 'Toussaint', start: '2026-10-17', end: '2026-11-02' },
    { name: 'Noël fin d\'année', start: '2026-12-19', end: '2026-12-31' },
  ],
  2027: [
    { name: 'Noël fin d\'année', start: '2027-01-01', end: '2027-01-04' },
    { name: 'Vacances d\'hiver', start: '2027-02-06', end: '2027-02-22' },
    { name: 'Vacances de printemps', start: '2027-04-10', end: '2027-04-26' },
    { name: 'Grandes vacances', start: '2027-07-03', end: '2027-08-31' },
    { name: 'Toussaint', start: '2027-10-16', end: '2027-11-01' },
    { name: 'Noël fin d\'année', start: '2027-12-18', end: '2027-12-31' },
  ],
  2025: [
    { name: 'Noël fin d\'année', start: '2025-01-01', end: '2025-01-05' },
    { name: 'Vacances d\'hiver', start: '2025-02-08', end: '2025-02-24' },
    { name: 'Vacances de printemps', start: '2025-04-12', end: '2025-04-28' },
    { name: 'Grandes vacances', start: '2025-07-05', end: '2025-08-31' },
    { name: 'Toussaint', start: '2025-10-18', end: '2025-11-03' },
    { name: 'Noël fin d\'année', start: '2025-12-20', end: '2025-12-31' },
  ],
};

app.use(express.static(clientDist));

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'Planning ATSEM', city: "Marie de L'Haÿ-les-Roses" });
});

app.get('/api/vacations/:year', (req: Request, res: Response) => {
  const year: number = parseInt(req.params.year as string, 10);
  // Try official source first, then fallback to local data
  getOfficialVacations().then((official: any) => {
    if (official && official.years && official.years[year]) {
      // official.years[year] may provide zones; try zone C first
      const yData = official.years[year];
      let vacations: any;
      if (yData.C) {
        vacations = yData.C;
      } else if (Array.isArray(yData)) {
        vacations = yData;
      }
      if (vacations) {
        return res.json({ year, zone: 'C', vacations, source: official.source });
      }
    }
    const vacations: VacationPeriod[] | undefined = vacationsByYear[year];
    if (!vacations) {
      return res.status(404).json({ error: `Vacances scolaires non disponibles pour l'année ${year}` });
    }
    res.json({ year, zone: 'C', vacations, source: { local: true } });
  }).catch(() => {
    const vacations: VacationPeriod[] | undefined = vacationsByYear[year];
    if (!vacations) {
      return res.status(404).json({ error: `Vacances scolaires non disponibles pour l'année ${year}` });
    }
    res.json({ year, zone: 'C', vacations, source: { local: true } });
  });
});

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`Portail applicatif démarré sur http://localhost:${port}`);
});

