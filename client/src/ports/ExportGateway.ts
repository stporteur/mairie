import type { ExportCalendarRequest } from '@shared/types/export';
import type { ForecastExportRequest } from '@shared/types/forecast';

export interface ExportGateway {
  exportCalendar(request: ExportCalendarRequest): Promise<Blob>;
  exportForecast(request: ForecastExportRequest): Promise<Blob>;
}
