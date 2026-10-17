export type LeaveProfileKey = 'atsem365' | 'atsem375' | 'mairie375';
export type SelectedLeaveProfile = LeaveProfileKey | 'custom';

export interface LeaveSettings {
  cpDays: string;
  rttDays: string;
  schoolWeeklyHours: string;
  vacationWeeklyHours: string;
}

export interface LeaveProfile {
  label: string;
  rttDays: string;
  vacationWeeklyHours: string;
  schoolWeeklyHours: string;
}

export type LeaveProfiles = Record<LeaveProfileKey, LeaveProfile>;

export interface ForecastSummaryRow {
  year: number;
  cpDays: number;
  rttDays: number;
  totalLeave: number;
  workHours: number;
  hoursDue: number;
}
