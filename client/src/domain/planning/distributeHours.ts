import type { WeekdayNumber } from './types';

export const WORKING_WEEKDAYS: readonly WeekdayNumber[] = [1, 2, 3, 4, 5];

export function workdaysExcluding(restDays: ReadonlySet<WeekdayNumber>): WeekdayNumber[] {
  return WORKING_WEEKDAYS.filter((weekday) => !restDays.has(weekday));
}

/**
 * Splits weekly hours across the given weekdays in quarter-hour steps; the leftover
 * quarter hours go to the weekdays listed first in `priority`.
 */
export function distributeQuarterHours(
  weeklyHours: number,
  workdays: readonly WeekdayNumber[],
  priority: readonly WeekdayNumber[],
): Map<WeekdayNumber, number> {
  if (workdays.length === 0) return new Map();

  const totalQuarterHours = Math.round(weeklyHours * 4);
  const baseQuarterHours = Math.floor(totalQuarterHours / workdays.length);
  const extraQuarterHours = totalQuarterHours % workdays.length;
  const quarterHoursByWeekday = new Map(workdays.map((weekday) => [weekday, baseQuarterHours]));

  priority
    .filter((weekday) => quarterHoursByWeekday.has(weekday))
    .slice(0, extraQuarterHours)
    .forEach((weekday) => quarterHoursByWeekday.set(weekday, baseQuarterHours + 1));

  return new Map([...quarterHoursByWeekday].map(([weekday, quarterHours]) => [weekday, quarterHours / 4]));
}
