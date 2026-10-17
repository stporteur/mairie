import type { AppServices } from '@/application/AppServices';
import { forecastFilename } from '@/domain/export/filenames';
import { getProfileLabel } from '@/domain/settings/leaveProfiles';
import type { LeaveProfiles, SelectedLeaveProfile } from '@/domain/settings/types';
import { FORECAST_YEAR_COUNT } from '@/config/constants';
import type { ForecastSummaryRow } from '@shared/types/forecast';
import type { StateSetter } from '../types';

export interface ExportForecastDeps {
  startYear: number;
  profiles: LeaveProfiles;
  profile: SelectedLeaveProfile;
  rows: ForecastSummaryRow[];
  exporting: boolean;
  setExporting: StateSetter<boolean>;
  setError: StateSetter<string>;
  services: Pick<AppServices, 'exports' | 'downloader'>;
}

export function createExportForecast(deps: ExportForecastDeps) {
  return async (): Promise<void> => {
    if (deps.rows.length !== FORECAST_YEAR_COUNT || deps.exporting) return;
    deps.setExporting(true);
    deps.setError('');
    try {
      const label = getProfileLabel(deps.profiles, deps.profile);
      const file = await deps.services.exports.exportForecast({
        startYear: deps.startYear,
        profile: label,
        rows: deps.rows,
      });
      deps.services.downloader.download(file, forecastFilename(deps.startYear, label));
    } catch (failure) {
      deps.setError(failure instanceof Error ? failure.message : 'Impossible d’exporter le prévisionnel.');
    } finally {
      deps.setExporting(false);
    }
  };
}
