import type { ExportCalendarRequest } from '../../../shared/types/export';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';
import { A3_LANDSCAPE, loadFirstWorksheet, pdfResult, renderWorksheetPdf } from '../pdf/renderWorksheetPdf';
import { safeProfileName } from '../safeProfileName';
import { generateCalendarWorkbook } from './generateCalendarWorkbook';

const PRINT_COLUMNS = 38; // A:AL
const PRINT_ROWS = 59;

/** Renders the generated Excel calendar (the template, filled) on a single A3 landscape page. */
export async function generateCalendarPdf(request: ExportCalendarRequest): Promise<GeneratedWorkbook> {
  const generated = await generateCalendarWorkbook(request);
  const worksheet = await loadFirstWorksheet(generated.buffer, 'Feuil1');
  const pdf = await renderWorksheetPdf(worksheet, {
    title: `Planning ${request.year} - ${request.profile}`,
    pageSize: A3_LANDSCAPE,
    columns: PRINT_COLUMNS,
    rows: PRINT_ROWS,
  });
  return pdfResult(pdf, `Planing_${request.year}_${safeProfileName(request.profile)}.pdf`);
}
