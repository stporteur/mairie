import type { ForecastComparisonExportRequest } from '../../../shared/types/forecast';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';
import { A4_LANDSCAPE, A3_LANDSCAPE, loadFirstWorksheet, pdfResult, renderWorksheetPdf } from '../pdf/renderWorksheetPdf';
import { generateForecastComparisonWorkbook } from './generateForecastComparisonWorkbook';

const YEAR_COUNT = 10;
const FIRST_DATA_ROW = 5;
const WIDE_COMPARISON = 4; // profiles; beyond this A3 keeps the table readable

/** Renders the comparison Excel sheet on one landscape page. */
export async function generateForecastComparisonPdf(request: ForecastComparisonExportRequest): Promise<GeneratedWorkbook> {
  const generated = await generateForecastComparisonWorkbook(request);
  const worksheet = await loadFirstWorksheet(generated.buffer, 'Comparatif');
  const pdf = await renderWorksheetPdf(worksheet, {
    title: `Comparatif ${request.startYear}`,
    pageSize: request.profiles.length > WIDE_COMPARISON ? A3_LANDSCAPE : A4_LANDSCAPE,
    columns: 1 + request.profiles.length * 2,
    rows: FIRST_DATA_ROW + YEAR_COUNT,
    maxScale: 1.5,
    centerVertically: false,
  });
  return pdfResult(pdf, `Comparatif_${request.startYear}.pdf`);
}
