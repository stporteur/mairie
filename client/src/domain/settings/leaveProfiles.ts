import { DEFAULT_PLANNING } from '../planning/createPlanningStrategy';
import type { PlanningDescriptor } from '../planning/types';
import type { LeaveProfile, LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from './types';
import { CUSTOM_PROFILE } from './types';

export const DEFAULT_LEAVE_SETTINGS: LeaveSettings = {
  cpDays: '25',
  rttDays: '9',
  schoolWeeklyHours: '37',
  vacationWeeklyHours: '35',
};

export function findProfile(profiles: LeaveProfiles, key: SelectedLeaveProfile): LeaveProfile | undefined {
  return profiles.find((profile) => profile.key === key);
}

export function isSelectedLeaveProfile(profiles: LeaveProfiles, value: unknown): value is SelectedLeaveProfile {
  return value === CUSTOM_PROFILE || profiles.some((profile) => profile.key === value);
}

export function getProfileLabel(profiles: LeaveProfiles, profile: SelectedLeaveProfile): string {
  return findProfile(profiles, profile)?.label ?? 'Custom';
}

/** The working-week description of the profile; free values use the default planning. */
export function getPlanning(profiles: LeaveProfiles, profile: SelectedLeaveProfile): PlanningDescriptor {
  return findProfile(profiles, profile)?.planning ?? DEFAULT_PLANNING;
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
