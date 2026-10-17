import { normalizeLeaveSettings } from '@/domain/settings/normalize';
import { validatePlanningSettings } from '@/domain/settings/validate';
import type { LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import type { StateSetter } from '../types';

export interface CalculatePlanningDeps {
  settings: LeaveSettings;
  profile: SelectedLeaveProfile;
  setSettings: StateSetter<LeaveSettings>;
  setAppliedSettings: StateSetter<LeaveSettings>;
  setAppliedProfile: StateSetter<SelectedLeaveProfile>;
  setError: StateSetter<string>;
}

/** Validates the draft settings and applies them to the calendar. */
export function createCalculatePlanning(deps: CalculatePlanningDeps) {
  return (): void => {
    const error = validatePlanningSettings(deps.settings);
    if (error) {
      deps.setError(error);
      return;
    }

    const normalized = normalizeLeaveSettings(deps.settings);
    deps.setSettings(normalized);
    deps.setAppliedSettings(normalized);
    deps.setAppliedProfile(deps.profile);
    deps.setError('');
  };
}
