import type { LeaveProfile, LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from './types';
import { CUSTOM_PROFILE } from './types';

export const DEFAULT_LEAVE_SETTINGS: LeaveSettings = {
  cpDays: '25',
  rttDays: '9',
  schoolWeeklyHours: '37',
  vacationWeeklyHours: '35',
};

/** School week length used when no catalog profile is selected. */
export const DEFAULT_SCHOOL_WORKDAYS_PER_WEEK = 4;

export function findProfile(profiles: LeaveProfiles, key: SelectedLeaveProfile): LeaveProfile | undefined {
  return profiles.find((profile) => profile.key === key);
}

export function isSelectedLeaveProfile(profiles: LeaveProfiles, value: unknown): value is SelectedLeaveProfile {
  return value === CUSTOM_PROFILE || profiles.some((profile) => profile.key === value);
}

export function getProfileLabel(profiles: LeaveProfiles, profile: SelectedLeaveProfile): string {
  return findProfile(profiles, profile)?.label ?? 'Custom';
}

export function getSchoolWorkdaysPerWeek(profiles: LeaveProfiles, profile: SelectedLeaveProfile): number {
  return findProfile(profiles, profile)?.schoolWorkdaysPerWeek ?? DEFAULT_SCHOOL_WORKDAYS_PER_WEEK;
}

export function findMatchingProfile(profiles: LeaveProfiles, settings: LeaveSettings): SelectedLeaveProfile {
  return profiles.find((profile) =>
    profile.rttDays === settings.rttDays &&
    profile.vacationWeeklyHours === settings.vacationWeeklyHours &&
    profile.schoolWeeklyHours === settings.schoolWeeklyHours,
  )?.key ?? CUSTOM_PROFILE;
}

/** Returns the settings with the profile's values applied; a custom profile clears them. */
export function applyProfileToSettings(
  profiles: LeaveProfiles,
  settings: LeaveSettings,
  profile: SelectedLeaveProfile,
): LeaveSettings {
  const selected = findProfile(profiles, profile);
  if (!selected) {
    return { ...settings, rttDays: '', vacationWeeklyHours: '', schoolWeeklyHours: '' };
  }
  const { rttDays, vacationWeeklyHours, schoolWeeklyHours } = selected;
  return { ...settings, rttDays, vacationWeeklyHours, schoolWeeklyHours };
}
