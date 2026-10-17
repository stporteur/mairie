import type { LeavePreferencesStore } from '@/ports/LeavePreferencesStore';
import {
  applyProfileToSettings,
  DEFAULT_LEAVE_SETTINGS,
  findMatchingProfile,
  isSelectedLeaveProfile,
} from '@/domain/settings/leaveProfiles';
import { normalizeLeaveSettings, normalizeSchoolWeeklyHours } from '@/domain/settings/normalize';
import { CUSTOM_PROFILE, type LeaveProfiles, type LeaveSettings, type SelectedLeaveProfile } from '@/domain/settings/types';

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

function profileOrMatching(profiles: LeaveProfiles, saved: string | null, settings: LeaveSettings): SelectedLeaveProfile {
  if (isSelectedLeaveProfile(profiles, saved)) return saved;
  const matching = findMatchingProfile(profiles, settings);
  // Nothing saved or matching: start on the first catalog profile rather than on free values.
  return matching === CUSTOM_PROFILE && profiles.length > 0 ? profiles[0].key : matching;
}

/** Restores the leave state saved by the user, falling back to the profile matching the saved values. */
export function loadLeaveState(store: LeavePreferencesStore, profiles: LeaveProfiles): LeaveState {
  const savedSettings = readAppliedSettings(store);
  const selectedProfile = profileOrMatching(profiles, store.readProfile(), savedSettings);
  const appliedProfile = profileOrMatching(profiles, store.readAppliedProfile(), savedSettings);
  // A profile chosen by default carries its own values.
  const appliedSettings = isSelectedLeaveProfile(profiles, store.readAppliedProfile())
    ? savedSettings
    : applyProfileToSettings(profiles, savedSettings, appliedProfile);

  return {
    selectedProfile,
    draftSettings: applyProfileToSettings(profiles, savedSettings, selectedProfile),
    appliedSettings,
    appliedProfile,
  };
}
