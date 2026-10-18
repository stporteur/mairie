import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateCalendarPdf } from './export/calendar/generateCalendarPdf';
import { generateForecastComparisonPdf } from './export/forecast/generateForecastComparisonPdf';
import { generateForecastPdf } from './export/forecast/generateForecastPdf';

const rows = Array.from({ length: 10 }, (_, index) => ({
  year: 2026 + index,
  cpDays: 25,
  rttDays: 15,
  totalLeave: 40,
  workHours: 1580.5 + index,
  hoursDue: 27 - index,
}));

function pageCount(buffer: ArrayBuffer): number {
  return (Buffer.from(buffer).toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;
}

async function run(): Promise<void> {
  const calendar = await generateCalendarPdf({ year: 2026, profile: '37h30 MAIRIE', profileDetails: '9 jours RTT', days: [] });
  const forecast = await generateForecastPdf({ startYear: 2026, profile: '37h30 MAIRIE', rows });
  const comparison = await generateForecastComparisonPdf({
    startYear: 2026,
    profiles: [
      { label: '37h30 MAIRIE', description: '25 jours CP · 15 jours RTT', rows },
      { label: '36h30 ATSEM', description: '25 jours CP · 9 jours RTT', rows },
    ],
  });

  assert.equal(calendar.filename, 'Planing_2026_37H30_MAIRIE.pdf');
  assert.equal(forecast.filename, 'Previsionnel_2026_37H30_MAIRIE.pdf');
  assert.equal(comparison.filename, 'Comparatif_2026.pdf');
  for (const file of [calendar, forecast, comparison]) {
    assert.equal(file.contentType, 'application/pdf');
    assert.equal(Buffer.from(file.buffer).subarray(0, 5).toString(), '%PDF-');
    assert.equal(pageCount(file.buffer), 1);
  }
  if (process.env.PDF_SAMPLE_DIR) {
    for (const file of [calendar, forecast, comparison]) {
      fs.writeFileSync(`${process.env.PDF_SAMPLE_DIR}/${file.filename}`, Buffer.from(file.buffer));
    }
  }
  console.log('PDF export tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
