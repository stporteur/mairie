import type { ForecastSummaryRow } from '@shared/types/forecast';
import { FORECAST_YEAR_COUNT } from '@/config/constants';
import { buildForecastRow } from '@/domain/summary/forecastRow';
import type { LeaveParameters } from '@/domain/settings/types';
import type { AppServices } from './AppServices';
import { allocateYearLeave } from './computeYearPlan';
import { loadPreparedVacations } from './loadPreparedVacations';

export interface ForecastRequest {
  startYear: number;
  parameters: LeaveParameters;
  onProgress?: (year: number, index: number, total: number) => void;
}

/** Computes the yearly summary for the {@link FORECAST_YEAR_COUNT} years following `startYear`. */
export async function computeForecast(
  { startYear, parameters, onProgress }: ForecastRequest,
  services: Pick<AppServices, 'vacations' | 'holidays'>,
): Promise<ForecastSummaryRow[]> {
  const rows: ForecastSummaryRow[] = [];

  for (let offset = 0; offset < FORECAST_YEAR_COUNT; offset += 1) {
    const year = startYear + offset;
    onProgress?.(year, offset + 1, FORECAST_YEAR_COUNT);
    const { vacations } = await loadPreparedVacations(services.vacations, year);
    rows.push(buildForecastRow(year, allocateYearLeave(year, vacations, parameters, services.holidays)));
  }

  return rows;
}
