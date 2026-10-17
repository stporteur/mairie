import { DEFAULT_LEAVE_SETTINGS } from './leaveProfiles';
import type { LeaveParameters, LeaveSettingKey, LeaveSettings } from './types';

const QUARTER_HOUR_TOLERANCE = 1e-8;
const MAX_SCHOOL_WEEKLY_HOURS = 39;

export function normalizeQuota(value: string, fallback: number): number {
  if (value === '') return 0;
  const quota = Number(value);
  return Number.isInteger(quota) && quota >= 0 ? quota : fallback;
}

export function normalizeWeeklyHours(value: string, fallback: number): number {
  if (value === '') return 0;
  const hours = Number(value);
  return Number.isFinite(hours) && hours >= 0 ? hours : fallback;
}

export function isValidSchoolWeeklyHours(hours: number): boolean {
  const quarterHours = hours * 4;
  return Number.isFinite(hours) && hours >= 0 && hours <= MAX_SCHOOL_WEEKLY_HOURS &&
    Math.abs(quarterHours - Math.round(quarterHours)) <= QUARTER_HOUR_TOLERANCE;
}

export function normalizeSchoolWeeklyHours(value: string, fallback: number): number {
  const hours = Number(value);
  return isValidSchoolWeeklyHours(hours) ? hours : fallback;
}

function defaultOf(key: LeaveSettingKey): number {
  return Number(DEFAULT_LEAVE_SETTINGS[key]);
}

/** Normalizes every field and returns them as strings, ready to display. */
export function normalizeLeaveSettings(settings: LeaveSettings): LeaveSettings {
  return {
    cpDays: String(normalizeQuota(settings.cpDays, defaultOf('cpDays'))),
    rttDays: String(normalizeQuota(settings.rttDays, defaultOf('rttDays'))),
    schoolWeeklyHours: String(normalizeWeeklyHours(settings.schoolWeeklyHours, defaultOf('schoolWeeklyHours'))),
    vacationWeeklyHours: String(normalizeWeeklyHours(settings.vacationWeeklyHours, defaultOf('vacationWeeklyHours'))),
  };
}

/** Normalizes one field on blur (school hours are validated on calculation instead). */
export function normalizeSettingValue(setting: LeaveSettingKey, value: string): string {
  const fallback = defaultOf(setting);
  return String(setting === 'cpDays' || setting === 'rttDays'
    ? normalizeQuota(value, fallback)
    : normalizeWeeklyHours(value, fallback));
}

export function toLeaveParameters(settings: LeaveSettings, schoolWorkdaysPerWeek: number): LeaveParameters {
  return {
    cpQuota: normalizeQuota(settings.cpDays, defaultOf('cpDays')),
    rttQuota: normalizeQuota(settings.rttDays, defaultOf('rttDays')),
    schoolWeeklyHours: normalizeWeeklyHours(settings.schoolWeeklyHours, defaultOf('schoolWeeklyHours')),
    vacationWeeklyHours: normalizeWeeklyHours(settings.vacationWeeklyHours, defaultOf('vacationWeeklyHours')),
    schoolWorkdaysPerWeek,
  };
}

/** Parses a school weekly hours field; null when empty or invalid. */
export function parseSchoolWeeklyHours(value: string): number | null {
  if (value.trim() === '') return null;
  const hours = Number(value);
  return isValidSchoolWeeklyHours(hours) ? hours : null;
}
