import type { LeaveSettings } from './types';
import { parseSchoolWeeklyHours } from './normalize';

export const PLANNING_SCHOOL_HOURS_ERROR =
  'Les heures/semaine Scolaire doivent être un multiple de 0,25 h compris entre 0 et 39 h.';
export const FORECAST_SCHOOL_HOURS_ERROR =
  'Les heures/semaine scolaire doivent être un multiple de 0,25 h compris entre 0 et 39 h.';
export const FORECAST_MISSING_FIELDS_ERROR =
  'Renseignez le nombre de RTT et les heures/semaine en vacances.';

/** Returns an error message, or null when the settings can be calculated. */
export function validatePlanningSettings(settings: LeaveSettings): string | null {
  return parseSchoolWeeklyHours(settings.schoolWeeklyHours) === null ? PLANNING_SCHOOL_HOURS_ERROR : null;
}

export function validateForecastSettings(settings: LeaveSettings): string | null {
  if (parseSchoolWeeklyHours(settings.schoolWeeklyHours) === null) return FORECAST_SCHOOL_HOURS_ERROR;
  if (settings.rttDays === '' || settings.vacationWeeklyHours === '') return FORECAST_MISSING_FIELDS_ERROR;
  return null;
}
