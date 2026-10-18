import ExcelJS from 'exceljs';
import type { ForecastComparisonExportRequest } from '../../../shared/types/forecast';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';

const YEAR_COUNT = 10;
const DARK = 'FF111827';
const GROUP_SEPARATOR = { style: 'medium', color: { argb: 'FF9CA3AF' } } as const;
const THIN = { style: 'thin', color: { argb: 'FF9CA3AF' } } as const;

function fill(argb: string) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } } as const;
}

export async function generateForecastComparisonWorkbook(
  request: ForecastComparisonExportRequest,
): Promise<GeneratedWorkbook> {
  if (!Number.isInteger(request.startYear) || request.startYear < 2020 || request.startYear > 2050) {
    throw new Error('Année de départ invalide.');
  }
  if (!Array.isArray(request.profiles) || request.profiles.length === 0) {
    throw new Error('Sélectionnez au moins un profil à comparer.');
  }
  request.profiles.forEach((profile) => {
    const valid = Array.isArray(profile.rows) && profile.rows.length === YEAR_COUNT && profile.rows.every((row, index) =>
      row.year === request.startYear + index && Number.isFinite(row.workHours) && Number.isFinite(row.hoursDue));
    if (!valid) throw new Error('Les lignes du comparatif sont invalides ou désordonnées.');
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Planning ATSEM';
  workbook.subject = `Comparatif ${request.startYear}–${request.startYear + YEAR_COUNT - 1}`;

  const worksheet = workbook.addWorksheet('Comparatif', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 4 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });
  const lastColumn = 1 + request.profiles.length * 2;
  worksheet.getColumn(1).width = 14;
  for (let column = 2; column <= lastColumn; column += 1) worksheet.getColumn(column).width = 20;

  worksheet.mergeCells(1, 1, 1, lastColumn);
  const title = worksheet.getCell(1, 1);
  title.value = `Comparatif ${request.startYear}–${request.startYear + YEAR_COUNT - 1}`;
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.fill = fill(DARK);
  title.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(1).height = 28;

  // Two-level header: row 3 holds the profile (name and description), row 4 the column titles.
  worksheet.mergeCells(3, 1, 4, 1);
  worksheet.getCell(3, 1).value = 'Année';
  request.profiles.forEach((profile, index) => {
    const first = 2 + index * 2;
    worksheet.mergeCells(3, first, 3, first + 1);
    worksheet.getCell(3, first).value = {
      richText: [
        { text: profile.label, font: { bold: true, size: 13, color: { argb: 'FFFFFFFF' } } },
        { text: `\n${profile.description}`, font: { size: 9, color: { argb: 'FFFFFFFF' } } },
      ],
    };
    worksheet.getCell(4, first).value = 'Total Heures';
    worksheet.getCell(4, first + 1).value = 'Heures Dues';
  });
  worksheet.getRow(3).height = 40;
  worksheet.getRow(4).height = 22;

  for (let row = 3; row <= 4; row += 1) {
    for (let column = 1; column <= lastColumn; column += 1) {
      const cell = worksheet.getCell(row, column);
      cell.fill = fill(DARK);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: THIN, bottom: THIN, left: THIN, right: THIN };
    }
  }

  for (let offset = 0; offset < YEAR_COUNT; offset += 1) {
    const rowNumber = 5 + offset;
    const row = worksheet.getRow(rowNumber);
    row.getCell(1).value = request.startYear + offset;
    request.profiles.forEach((profile, index) => {
      const first = 2 + index * 2;
      row.getCell(first).value = Number(profile.rows[offset].workHours.toFixed(2));
      row.getCell(first + 1).value = Number(profile.rows[offset].hoursDue.toFixed(2));
    });
    for (let column = 1; column <= lastColumn; column += 1) {
      const cell = row.getCell(column);
      const startsGroup = column > 1 && column % 2 === 0;
      cell.numFmt = column === 1 ? '0' : '0.00';
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: THIN, ...(startsGroup ? { left: GROUP_SEPARATOR } : { left: THIN }) };
      if (offset % 2 === 1) cell.fill = fill('FFF3F4F6');
    }
  }

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    filename: `Comparatif_${request.startYear}.xlsx`,
  };
}
