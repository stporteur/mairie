import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { generateForecastWorkbook } from './export/forecast/generateForecastWorkbook';
import { generateForecastComparisonWorkbook } from './export/forecast/generateForecastComparisonWorkbook';

async function run(): Promise<void> {
  const rows = Array.from({ length: 10 }, (_, index) => ({
    year: 2026 + index,
    cpDays: 25,
    rttDays: 15,
    totalLeave: 40,
    workHours: 1580 + index,
    hoursDue: 27 - index,
  }));
  const generated = await generateForecastWorkbook({
    startYear: 2026,
    profile: '37h30 MAIRIE',
    rows,
  });
  assert.equal(generated.filename, 'Previsionnel_2026_37H30_MAIRIE.xlsx');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(generated.buffer);
  const sheet = workbook.getWorksheet('Prévisionnel');
  assert.ok(sheet);
  assert.equal(sheet.getCell('A3').value, 'Année');
  assert.equal(sheet.getCell('A4').value, 2026);
  assert.equal(sheet.getCell('A13').value, 2035);
  assert.equal(sheet.getCell('B4').value, 25);
  assert.equal(sheet.getCell('C4').value, 15);
  assert.equal(sheet.getCell('D4').value, 40);
  assert.equal(sheet.getCell('E4').value, 1580);
  assert.equal(sheet.getCell('F13').value, 18);
  assert.equal(sheet.getCell('A1').value, 'Prévisionnel 2026–2035 · 37h30 MAIRIE');

  await assert.rejects(
    () => generateForecastWorkbook({ startYear: 2026, profile: 'Custom', rows: rows.slice(0, 9) }),
    /exactement dix années/,
  );

  const comparison = await generateForecastComparisonWorkbook({
    startYear: 2026,
    profiles: [
      { label: 'A', description: 'desc A', rows },
      { label: 'B', description: 'desc B', rows },
    ],
  });
  const comparisonBook = new ExcelJS.Workbook();
  await comparisonBook.xlsx.load(comparison.buffer);
  const comparisonSheet = comparisonBook.getWorksheet('Comparatif');
  assert.ok(comparisonSheet);
  assert.equal(comparisonSheet.getCell('A3').value, 'Année');
  assert.equal(comparisonSheet.getCell('B4').value, 'Total Heures');
  assert.equal(comparisonSheet.getCell('E4').value, 'Heures Dues');
  assert.equal(comparisonSheet.getCell('A14').value, 2035);
  assert.equal(comparisonSheet.getCell('D5').value, 1580);
  assert.equal(comparisonSheet.getCell('E14').value, 18);
  assert.equal(comparisonSheet.getCell('A15').value, 'TOTAL');
  assert.equal(comparisonSheet.getCell('C15').value, 225);
  assert.equal(comparisonSheet.getCell('E15').value, 225);

  await assert.rejects(
    () => generateForecastComparisonWorkbook({ startYear: 2026, profiles: [] }),
    /au moins un profil/,
  );

  console.log('Forecast export tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
