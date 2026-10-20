import type { ForecastExportRequest } from '../../../shared/types/forecast';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';
import { A4_LANDSCAPE, loadFirstWorksheet, pdfResult, renderWorksheetPdf } from '../pdf/renderWorksheetPdf';
import { safeProfileName } from '../safeProfileName';
import { generateForecastWorkbook } from './generateForecastWorkbook';

/** Renders the forecast Excel sheet (title, header, ten yearly rows) on one A4 landscape page. */
export async function generateForecastPdf(request: ForecastExportRequest): Promise<GeneratedWorkbook> {
  const generated = await generateForecastWorkbook(request);
  const worksheet = await loadFirstWorksheet(generated.buffer, 'Prévisionnel');
  const pdf = await renderWorksheetPdf(worksheet, {
    title: `Prévisionnel ${request.startYear} - ${request.profile}`,
    pageSize: A4_LANDSCAPE,
    columns: 6,
    rows: 3 + request.rows.length,
    maxScale: 1.5,
    centerVertically: false,
  });
  return pdfResult(pdf, `Previsionnel_${request.startYear}_${safeProfileName(request.profile)}.pdf`);
}
