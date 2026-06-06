const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 4000;
const clientDist = path.resolve(__dirname, '../client/dist');

// Vacances scolaires officielles zone C (Paris) par année
const { getOfficialVacations } = require('./officialHolidays');

const vacationsByYear = {
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

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', app: 'Planning ATSEM', city: "Marie de L'Haÿ-les-Roses" });
});

app.get('/api/vacations/:year', (req, res) => {
  const year = parseInt(req.params.year, 10);
  // Try official source first, then fallback to local data
  getOfficialVacations().then(official => {
    if (official && official.years && official.years[year]) {
      // official.years[year] may provide zones; try zone C first
      const yData = official.years[year];
      if (yData.C) return res.json({ year, zone: 'C', vacations: yData.C, source: official.source });
      // If structure is different, try to return something sensible
      if (Array.isArray(yData)) return res.json({ year, zone: 'C', vacations: yData, source: official.source });
    }
    const vacations = vacationsByYear[year];
    if (!vacations) {
      return res.status(404).json({ error: `Vacances scolaires non disponibles pour l'année ${year}` });
    }
    res.json({ year, zone: 'C', vacations, source: { local: true } });
  }).catch(() => {
    const vacations = vacationsByYear[year];
    if (!vacations) {
      return res.status(404).json({ error: `Vacances scolaires non disponibles pour l'année ${year}` });
    }
    res.json({ year, zone: 'C', vacations, source: { local: true } });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`Portail applicatif démarré sur http://localhost:${port}`);
});
