import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { generateCalendarWorkbook } from './export/calendar/generateCalendarWorkbook';

const year = 2029;
const days = Array.from({ length: 365 }, (_, index) => {
  const date = new Date(Date.UTC(year, 0, index + 1));
  const isoDate = date.toISOString().slice(0, 10);
  const weekday = date.getUTCDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const isHoliday = isoDate === '2029-01-01';
  const isVacationDay = (isoDate >= '2029-07-07' && isoDate <= '2029-07-20') || isoDate === '2029-01-02';
  const isVacationWorkday = isoDate === '2029-07-09' || isoDate === '2029-01-02';
  const isRestDay = weekday === 3;

  return {
    date: isoDate,
    effectiveHours: isWeekend || isHoliday || isRestDay || (isVacationDay && !isVacationWorkday) ? 0 : 9.25,
    isWeekend,
    isHoliday,
    inVacation: isVacationDay,
    vacationEstimated: isoDate >= '2029-07-07' && isoDate <= '2029-07-20',
    isRestDay,
    isCp: isoDate === '2029-07-11',
    isRtt: isoDate === '2029-07-12',
  };
});

function assertFill(cell: ExcelJS.Cell, expectedArgb: string): void {
  const fill = cell.fill as ExcelJS.FillPattern;
  assert.equal(fill.fgColor?.argb, expectedArgb, `${cell.address} fill`);
}

async function run(): Promise<void> {
  const generated = await generateCalendarWorkbook({ year, profile: '37h30 MAIRIE', days });
  assert.equal(generated.filename, 'Planing_2029_37H30_MAIRIE.xlsx');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(generated.buffer);
  const sheet = workbook.getWorksheet('Feuil1');
  assert.ok(sheet);

  assert.equal(sheet.getCell('A41').value, 'Septembre');
  assert.equal(sheet.getCell('B41').value, 1);
  assert.equal(sheet.getCell('B42').value, 'S');
  assert.equal(sheet.getCell('E42').value, 'M');
  assert.equal(sheet.getCell('E43').value, 9.25);
  assert.equal(sheet.getCell('E44').value, null);
  assertFill(sheet.getCell('A1'), 'FFFFFFFF'); // Month title mirrors the white month-card title.

  assert.equal(sheet.getCell('AD6').value, null); // February 2029 has 28 days.
  assert.equal(sheet.getCell('AF31').value, 31);
  assert.equal(sheet.getCell('AF36').value, 31);

  assertFill(sheet.getCell('A3'), 'FF111827'); // Travail row label.
  assertFill(sheet.getCell('A4'), 'FF111827'); // Congés row label.
  assert.equal(sheet.getCell('B3').value, null); // Jan 1 is a holiday and has no work hours.
  assertFill(sheet.getCell('B1'), 'FF111827'); // Headers are dark except when in vacation.
  assertFill(sheet.getCell('B3'), 'FFD1D5DB'); // Holiday body color.
  assert.equal(sheet.getCell('C3').value, 9.25); // Jan 2 is worked during the Christmas break.
  assertFill(sheet.getCell('C1'), 'FFD8F3DC'); // Official-vacation header is green.
  assertFill(sheet.getCell('C3'), 'FFFFFFFF'); // Worked official-vacation weekday is white in the app.
  assertFill(sheet.getCell('G1'), 'FF111827'); // Saturday header, not vacation.
  assertFill(sheet.getCell('D3'), 'FFEFF2F7'); // Wednesday rest.
  assertFill(sheet.getCell('H31'), 'FFFDE68A'); // Estimated vacation header.
  assertFill(sheet.getCell('H33'), 'FFFDE68A'); // Estimated vacation weekend body.
  assert.equal(sheet.getCell('J33').value, 9.25); // July 9 is a workday within school vacation.
  assertFill(sheet.getCell('J33'), 'FFFEF3C7'); // Estimated vacation weekday follows the app's pastel-yellow style.
  assertFill(sheet.getCell('J34'), 'FFFEF3C7'); // Vacation weekday in the Congés row.
  assert.equal(sheet.getCell('L34').value, 1); // CP
  assert.equal(sheet.getCell('M34').value, 1); // RTT
  assert.equal((sheet.getCell('L34').font.color as ExcelJS.Color).argb, 'FF111827');
  assertFill(sheet.getCell('L34'), 'FFFEF3C7'); // CP text does not replace the app vacation fill.
  assert.equal(sheet.getCell('AI3').formula, 'SUM(B3:AF3)');
  assert.equal(sheet.getCell('AI3').result, days
    .filter((day) => day.date.startsWith('2029-01-'))
    .reduce((total, day) => total + day.effectiveHours, 0));
  assert.equal(sheet.getCell('AL59').formula, 'SUM(AI4,AI9,AI14,AI19,AI24,AI29,AI34,AI39,AI44,AI49,AI54,AI59)');
  assert.equal(sheet.getCell('AL59').result, 2);

  console.log('Calendar export tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});