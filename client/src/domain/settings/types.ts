export type LeaveProfileKey = 'atsem365' | 'atsem375' | 'mairie375';
export type SelectedLeaveProfile = LeaveProfileKey | 'custom';

/** Form values, kept as strings so that fields can be empty while typing. */
export interface LeaveSettings {
  cpDays: string;
  rttDays: string;
  schoolWeeklyHours: string;
  vacationWeeklyHours: string;
}

export type LeaveSettingKey = keyof LeaveSettings;

export interface LeaveProfile {
  label: string;
  rttDays: string;
  vacationWeeklyHours: string;
  schoolWeeklyHours: string;
}

export type LeaveProfiles = Record<LeaveProfileKey, LeaveProfile>;

/** Validated numeric values used by the calculations. */
export interface LeaveParameters {
  cpQuota: number;
  rttQuota: number;
  schoolWeeklyHours: number;
  vacationWeeklyHours: number;
  schoolWorkdaysPerWeek: number;
}
