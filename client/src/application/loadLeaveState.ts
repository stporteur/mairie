import type { LeavePreferencesStore } from '@/ports/LeavePreferencesStore';
import { DEFAULT_LEAVE_SETTINGS } from '@/domain/settings/leaveProfiles';
import { normalizeLeaveSettings, normalizeSchoolWeeklyHours } from '@/domain/settings/normalize';
import { NO_PROFILE, type LeaveSettings, type SelectedLeaveProfile } from '@/domain/settings/types';

export interface LeaveState {
  selectedProfile: SelectedLeaveProfile;
  draftSettings: LeaveSettings;
  appliedSettings: LeaveSettings;
  appliedProfile: SelectedLeaveProfile;
}

function readAppliedSettings(store: LeavePreferencesStore): LeaveSettings {
  const saved = store.readSettings() as Partial<Record<keyof LeaveSettings, unknown>> | null;
  const defaults = DEFAULT_LEAVE_SETTINGS;
  // Saved school hours are stricter than the other fields: invalid values revert to the default.
  const schoolWeeklyHours = String(normalizeSchoolWeeklyHours(
    String(saved?.schoolWeeklyHours ?? defaults.schoolWeeklyHours),
    Number(defaults.schoolWeeklyHours),
  ));
  return {
    ...normalizeLeaveSettings({
      cpDays: String(saved?.cpDays ?? defaults.cpDays),
      rttDays: String(saved?.rttDays ?? defaults.rttDays),
      schoolWeeklyHours,
      vacationWeeklyHours: String(saved?.vacationWeeklyHours ?? defaults.vacationWeeklyHours),
    }),
    schoolWeeklyHours,
  };
}

/** Restores the saved values; no profile is selected until the user picks one. */
export function loadLeaveState(store: LeavePreferencesStore): LeaveState {
  const savedSettings = readAppliedSettings(store);

  return {
    selectedProfile: NO_PROFILE,
    draftSettings: savedSettings,
    appliedSettings: savedSettings,
    appliedProfile: NO_PROFILE,
  };
}
