import type { LeaveProfileKey, LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from './types';

export const DEFAULT_LEAVE_SETTINGS: LeaveSettings = {
  cpDays: '25',
  rttDays: '9',
  schoolWeeklyHours: '37',
  vacationWeeklyHours: '35',
};

export const LEAVE_PROFILES: LeaveProfiles = {
  atsem365: { label: '36h30 ATSEM', rttDays: '9', vacationWeeklyHours: '35', schoolWeeklyHours: '37' },
  atsem375: { label: '37h30 ATSEM', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5' },
  mairie375: { label: '37h30 MAIRIE', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5' },
};

export const PROFILE_KEYS = Object.keys(LEAVE_PROFILES) as LeaveProfileKey[];
export const PROFILE_NAMES: SelectedLeaveProfile[] = [...PROFILE_KEYS, 'custom'];
export const DEFAULT_LEAVE_PROFILE: SelectedLeaveProfile = 'atsem365';

export function isSelectedLeaveProfile(value: unknown): value is SelectedLeaveProfile {
  return PROFILE_NAMES.includes(value as SelectedLeaveProfile);
}

export function getProfileLabel(profile: SelectedLeaveProfile): string {
  return profile === 'custom' ? 'Custom' : LEAVE_PROFILES[profile].label;
}

export function findMatchingProfile(settings: LeaveSettings): SelectedLeaveProfile {
  return PROFILE_KEYS.find((key) => {
    const profile = LEAVE_PROFILES[key];
    return profile.rttDays === settings.rttDays &&
      profile.vacationWeeklyHours === settings.vacationWeeklyHours &&
      profile.schoolWeeklyHours === settings.schoolWeeklyHours;
  }) || 'custom';
}

/** Returns the settings with the profile's values applied; a custom profile clears them. */
export function applyProfileToSettings(settings: LeaveSettings, profile: SelectedLeaveProfile): LeaveSettings {
  if (profile === 'custom') {
    return { ...settings, rttDays: '', vacationWeeklyHours: '', schoolWeeklyHours: '' };
  }
  const { rttDays, vacationWeeklyHours, schoolWeeklyHours } = LEAVE_PROFILES[profile];
  return { ...settings, rttDays, vacationWeeklyHours, schoolWeeklyHours };
}
