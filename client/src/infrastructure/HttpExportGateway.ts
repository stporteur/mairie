import type { ExportCalendarRequest } from '@shared/types/export';
import type { ForecastComparisonExportRequest, ForecastExportRequest } from '@shared/types/forecast';
import type { ExportGateway } from '@/ports/ExportGateway';

async function postForFile(url: string, body: unknown): Promise<Blob> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error || `Échec de l’export (${response.status}).`);
  }
  return response.blob();
}

export class HttpExportGateway implements ExportGateway {
  exportCalendar(request: ExportCalendarRequest): Promise<Blob> {
    return postForFile('/api/export', request);
  }

  exportForecast(request: ForecastExportRequest): Promise<Blob> {
    return postForFile('/api/export/forecast', request);
  }

  exportForecastComparison(request: ForecastComparisonExportRequest): Promise<Blob> {
    return postForFile('/api/export/forecast-comparison', request);
  }
}
