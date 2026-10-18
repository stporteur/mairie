import type { ExportCalendarRequest } from '@shared/types/export';
import type { ForecastComparisonExportRequest, ForecastExportRequest } from '@shared/types/forecast';

export interface ExportGateway {
  exportCalendar(request: ExportCalendarRequest, format?: 'xlsx' | 'pdf'): Promise<Blob>;
  exportForecast(request: ForecastExportRequest, format?: 'xlsx' | 'pdf'): Promise<Blob>;
  exportForecastComparison(request: ForecastComparisonExportRequest, format?: 'xlsx' | 'pdf'): Promise<Blob>;
}
