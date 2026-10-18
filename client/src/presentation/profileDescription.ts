import type { LeaveProfile } from '@/domain/settings/types';

/** One-line description of a profile's leave and weekly hours, as shown in the settings. */
export function describeProfileLeave(profile: LeaveProfile, cpDays: string): string {
  return `${cpDays} jours CP · ${profile.rttDays} jours RTT · ${profile.vacationWeeklyHours} h vacances · ${profile.schoolWeeklyHours} h scolaire`;
}
