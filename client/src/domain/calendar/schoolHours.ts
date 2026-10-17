const FIVE_DAY_WEEK = [1, 2, 3, 4, 5];
const FOUR_DAY_WEEK = [1, 2, 4, 5];
const FOUR_DAY_EXTRA_ORDER = [2, 4, 1, 5];

/** Splits the weekly school hours across weekdays in quarter-hour steps. */
export function getSchoolHoursByWeekday(
  schoolWeeklyHours: number,
  schoolWorkdaysPerWeek: number,
): Map<number, number> {
  const totalQuarterHours = Math.round(schoolWeeklyHours * 4);
  const weekdays = schoolWorkdaysPerWeek === 5 ? FIVE_DAY_WEEK : FOUR_DAY_WEEK;
  const baseQuarterHours = Math.floor(totalQuarterHours / weekdays.length);
  const extraQuarterHours = totalQuarterHours % weekdays.length;
  const quarterHoursByWeekday = new Map(weekdays.map((weekday) => [weekday, baseQuarterHours]));
  const preferredWeekdays = schoolWorkdaysPerWeek === 5 ? weekdays : FOUR_DAY_EXTRA_ORDER;

  preferredWeekdays.slice(0, extraQuarterHours).forEach((weekday) => {
    quarterHoursByWeekday.set(weekday, baseQuarterHours + 1);
  });

  return new Map(
    [...quarterHoursByWeekday].map(([weekday, quarterHours]) => [weekday, quarterHours / 4]),
  );
}
