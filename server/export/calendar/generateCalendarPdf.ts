import type { ExportCalendarRequest } from '../../../shared/types/export';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';
import { A3_LANDSCAPE, loadFirstWorksheet, pdfResult, renderWorksheetPdf } from '../pdf/renderWorksheetPdf';
import { safeProfileName } from '../safeProfileName';
import { generateCalendarWorkbook } from './generateCalendarWorkbook';

const PRINT_COLUMNS = 38; // A:AL
const PRINT_ROWS = 59;
const FIRST_DAY_COLUMN = 2; // B
const LAST_DAY_COLUMN = 32; // AF
const LABEL_COLUMNS = [1]; // A: month / work / leave labels
const MONTH_RECAP_COLUMNS = [34, 35]; // AH:AI monthly totals
const RECAP_COLUMNS = [37, 38]; // AK:AL annual recap table

/** Renders the generated Excel calendar (the template, filled) on a single A3 landscape page. */
export async function generateCalendarPdf(request: ExportCalendarRequest): Promise<GeneratedWorkbook> {
  const generated = await generateCalendarWorkbook(request);
  const worksheet = await loadFirstWorksheet(generated.buffer, 'Feuil1');
  // PDF-only layout tweaks: the Excel template is left untouched.
  for (let row = 1; row <= PRINT_ROWS; row += 1) {
    for (let column = 1; column <= PRINT_COLUMNS; column += 1) {
      const cell = worksheet.getCell(row, column);
      if (cell.alignment?.textRotation) continue;
      cell.alignment = { ...cell.alignment, horizontal: 'center', vertical: 'middle' };
    }
  }
  for (const column of LABEL_COLUMNS) {
    const col = worksheet.getColumn(column);
    col.width = (col.width ?? 10.57) * 1.4;
  }
  for (const column of MONTH_RECAP_COLUMNS) {
    const col = worksheet.getColumn(column);
    col.width = (col.width ?? 10.57) * 1.6;
  }
  for (const column of RECAP_COLUMNS) {
    const col = worksheet.getColumn(column);
    col.width = (col.width ?? 10.57) * 1.6;
  }
  const pdf = await renderWorksheetPdf(worksheet, {
    title: `Planning ${request.year} - ${request.profile}`,
    pageSize: A3_LANDSCAPE,
    columns: PRINT_COLUMNS,
    rows: PRINT_ROWS,
    marginX: 8,
    marginY: 8,
    stretchRows: true,
    fontBoost: 1.25,
    fontGroup: (row, column) => {
      if (column === 1) return 'label';
      if (column <= LAST_DAY_COLUMN) return 'days';
      if (MONTH_RECAP_COLUMNS.includes(column)) return 'monthRecap';
      if (RECAP_COLUMNS.includes(column) && row >= 55) return 'totalRecap';
      return undefined;
    },
  });
  return pdfResult(pdf, `Planing_${request.year}_${safeProfileName(request.profile)}.pdf`);
}
