import type { PlanningDescriptor } from '../planning/types';

export const CUSTOM_PROFILE = 'custom';

/** Key of a profile coming from the catalog, or `CUSTOM_PROFILE` for free values. */
export type SelectedLeaveProfile = string;

/** Form values, kept as strings so that fields can be empty while typing. */
export interface LeaveSettings {
  cpDays: string;
  rttDays: string;
  schoolWeeklyHours: string;
  vacationWeeklyHours: string;
}

export type LeaveSettingKey = keyof LeaveSettings;

export interface LeaveProfile {
  key: string;
  label: string;
  rttDays: string;
  vacationWeeklyHours: string;
  schoolWeeklyHours: string;
  planning: PlanningDescriptor;
}

export type LeaveProfiles = readonly LeaveProfile[];

/** Validated numeric values used by the calculations. */
export interface LeaveParameters {
  cpQuota: number;
  rttQuota: number;
  schoolWeeklyHours: number;
  vacationWeeklyHours: number;
  planning: PlanningDescriptor;
}
