import type { LeaveProfiles } from '@/domain/settings/types';

const ATSEM_PLANNING = { type: 'ATSEM', schoolRestDays: [3], vacationRestDays: [] } as const;

/** Same catalog as the former hard-coded profiles, keyed by readable names. */
export const PROFILES: LeaveProfiles = [
  { key: 'atsem365', label: '36h30 ATSEM', rttDays: '9', vacationWeeklyHours: '35', schoolWeeklyHours: '37', planning: ATSEM_PLANNING },
  { key: 'atsem375', label: '37h30 ATSEM', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5', planning: ATSEM_PLANNING },
  { key: 'mairie375', label: '37h30 MAIRIE', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5', planning: { type: 'STANDARD', schoolRestDays: [], vacationRestDays: [] } },
];
