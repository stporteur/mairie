import { computeForecast } from '@/application/computeForecast';
import type { AppServices } from '@/application/AppServices';
import { getPlanning } from '@/domain/settings/leaveProfiles';
import { normalizeLeaveSettings, toLeaveParameters } from '@/domain/settings/normalize';
import { validateForecastSettings } from '@/domain/settings/validate';
import type { LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import type { ForecastSummaryRow } from '@shared/types/forecast';
import type { StateSetter } from '../types';

export interface CalculateForecastDeps {
  startYear: number;
  yearCount: number;
  settings: LeaveSettings;
  profiles: LeaveProfiles;
  profile: SelectedLeaveProfile;
  setSettings: StateSetter<LeaveSettings>;
  setRows: StateSetter<ForecastSummaryRow[]>;
  setCalculating: StateSetter<boolean>;
  setProgress: StateSetter<string>;
  setError: StateSetter<string>;
  services: Pick<AppServices, 'vacations' | 'holidays'>;
}

export function createCalculateForecast(deps: CalculateForecastDeps) {
  return async (): Promise<void> => {
    const validationError = validateForecastSettings(deps.settings);
    if (validationError) {
      deps.setError(validationError);
      return;
    }

    deps.setCalculating(true);
    deps.setError('');
    deps.setRows([]);
    try {
      const rows = await computeForecast({
        startYear: deps.startYear,
        yearCount: deps.yearCount,
        parameters: toLeaveParameters(deps.settings, getPlanning(deps.profiles, deps.profile)),
        onProgress: (year, index, total) => deps.setProgress(`Calcul de ${year} (${index}/${total})…`),
      }, deps.services);

      deps.setRows(rows);
      deps.setSettings(normalizeLeaveSettings(deps.settings));
    } catch (failure) {
      deps.setError(failure instanceof Error ? failure.message : 'Impossible de calculer le prévisionnel.');
    } finally {
      deps.setCalculating(false);
      deps.setProgress('');
    }
  };
}
