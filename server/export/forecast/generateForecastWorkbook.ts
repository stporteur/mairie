import ExcelJS from 'exceljs';
import type { ForecastExportRequest } from '../../../shared/types/forecast';
import { isSupportedYear } from '../../../shared/vacations/supportedYears';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';
import { safeProfileName } from '../safeProfileName';

const FORECAST_HEADERS = [
  'Année',
  'Jours de CP',
  'Jours de RTT',
  'Congés totaux',
  'Heures de travail calculées',
  'Heures dues',
];

export async function generateForecastWorkbook(
  request: ForecastExportRequest,
): Promise<GeneratedWorkbook> {
  if (!isSupportedYear(request.startYear)) {
    throw new Error('Année de départ invalide.');
  }
  if (!Array.isArray(request.rows) || request.rows.length < 1 ||   request.rows.length > 50) {
      throw new Error('Le prévisionnel doit contenir entre 1 et 50 années.');
  }
  const lastYear = request.startYear + request.rows.length - 1;
  const lastRow = 3 + request.rows.length;

  request.rows.forEach((row, index) => {
    const values = [row.cpDays, row.rttDays, row.totalLeave, row.workHours, row.hoursDue];
    if (row.year !== request.startYear + index || values.some((value) => !Number.isFinite(value))) {
      throw new Error('Les lignes du prévisionnel sont invalides ou désordonnées.');
    }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Planning ATSEM';
  workbook.subject = `Prévisionnel ${request.startYear}–${lastYear}`;
  workbook.calcProperties.fullCalcOnLoad = true;

  const worksheet = workbook.addWorksheet('Prévisionnel', {
    views: [{ state: 'frozen', ySplit: 3 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });
  worksheet.columns = [
    { key: 'year', width: 14 },
    { key: 'cpDays', width: 16 },
    { key: 'rttDays', width: 16 },
    { key: 'totalLeave', width: 18 },
    { key: 'workHours', width: 30 },
    { key: 'hoursDue', width: 18 },
  ];
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = `Prévisionnel ${request.startYear}–${lastYear} · ${request.profile}`;
  worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
  worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(1).height = 28;

  const headerRow = worksheet.getRow(3);
  headerRow.values = FORECAST_HEADERS;
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } } };
  });

  request.rows.forEach((row) => {
    worksheet.addRow({
      ...row,
      workHours: Number(row.workHours.toFixed(2)),
      hoursDue: Number(row.hoursDue.toFixed(2)),
    });
  });
  worksheet.autoFilter = { from: 'A3', to: `F${lastRow}` };
  worksheet.getColumn('workHours').numFmt = '0.00';
  worksheet.getColumn('hoursDue').numFmt = '0.00';
  for (let row = 4; row <= lastRow; row += 1) {
    worksheet.getRow(row).eachCell((cell, columnNumber) => {
      cell.alignment = { horizontal: columnNumber === 1 ? 'center' : 'right', vertical: 'middle' };
      if (row % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      }
    });
  }

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    filename: `Previsionnel_${request.startYear}_${safeProfileName(request.profile)}.xlsx`,
  };
}
