import type { LeaveProfiles } from '@/domain/settings/types';

/** Same catalog as the former hard-coded profiles, keyed by readable names. */
export const PROFILES: LeaveProfiles = [
  { key: 'atsem365', label: '36h30 ATSEM', rttDays: '9', vacationWeeklyHours: '35', schoolWeeklyHours: '37', schoolWorkdaysPerWeek: 4 },
  { key: 'atsem375', label: '37h30 ATSEM', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5', schoolWorkdaysPerWeek: 4 },
  { key: 'mairie375', label: '37h30 MAIRIE', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5', schoolWorkdaysPerWeek: 5 },
];
