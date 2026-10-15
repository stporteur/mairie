import path from 'path';
import express, { Express, Request, Response } from 'express';
import { getOfficialVacations } from './officialHolidays';
import { isSupportedVacationYear, resolveVacationsForYear } from './vacations';
import { ExportCalendarRequest, generateCalendarWorkbook } from './export';

const app: Express = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const clientDist: string = path.resolve(__dirname, '../client/dist');

app.use(express.static(clientDist));
app.use(express.json({ limit: '2mb' }));

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'Planning ATSEM', city: "Marie de L'Haÿ-les-Roses" });
});

app.post('/api/export', async (req: Request, res: Response) => {
  try {
    const result = await generateCalendarWorkbook(req.body as ExportCalendarRequest);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.status(200).send(Buffer.from(result.buffer));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur pendant la génération du fichier Excel.';
    return res.status(400).json({ error: message });
  }
});

app.get('/api/vacations/:year', async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  if (!isSupportedVacationYear(year)) {
    return res.status(400).json({ error: 'L’année doit être un entier compris entre 2020 et 2050.' });
  }

  let official;
  try {
    official = await getOfficialVacations();
  } catch {
    // Continue with local data and then the estimate if the source is unavailable.
  }

  const result = resolveVacationsForYear(year, official);
  return res.json({ year, zone: 'C', ...result });
});

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`Portail applicatif démarré sur http://localhost:${port}`);
});

