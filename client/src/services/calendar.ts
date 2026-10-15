import { formatIso } from '../utils/date';
import { createHolidaySet } from './vacations';

export interface CalendarDay {
  date: string;
  month: number;
  isWeekend: boolean;
  isHoliday: boolean;
  inVacation: boolean;
  isWednesdayRest: boolean;
  isWorkday: boolean;
  defaultHours: number;
  vacationName: string | null;
  vacationEstimated: boolean;
  isCp: boolean;
  isRtt: boolean;
}

function getSchoolHoursByWeekday(schoolWeeklyHours: number, schoolWorkdaysPerWeek: number): Map<number, number> {
  const totalQuarterHours = Math.round(schoolWeeklyHours * 4);
  const weekdays = schoolWorkdaysPerWeek === 5 ? [1, 2, 3, 4, 5] : [1, 2, 4, 5];
  const baseQuarterHours = Math.floor(totalQuarterHours / weekdays.length);
  const extraQuarterHours = totalQuarterHours % weekdays.length;
  const quarterHoursByWeekday = new Map(weekdays.map((weekday) => [weekday, baseQuarterHours]));
  const preferredWeekdays = schoolWorkdaysPerWeek === 5 ? weekdays : [2, 4, 1, 5];

  preferredWeekdays.slice(0, extraQuarterHours).forEach((weekday) => {
    quarterHoursByWeekday.set(weekday, baseQuarterHours + 1);
  });

  return new Map(
    [...quarterHoursByWeekday].map(([weekday, quarterHours]) => [weekday, quarterHours / 4]),
  );
}

// Build a year calendar with workdays, holidays, and vacations
export function buildYearCalendar(
  year: number,
  vacations: { name: string; start: string; end: string; estimated?: boolean }[],
  vacationWeeklyHours = 35,
  schoolWeeklyHours = 37,
  schoolWorkdaysPerWeek = 4,
): CalendarDay[] {
  const holidaySet = createHolidaySet(year);
  const schoolHoursByWeekday = getSchoolHoursByWeekday(schoolWeeklyHours, schoolWorkdaysPerWeek);
  const calendar: CalendarDay[] = [];
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const lastDay = new Date(Date.UTC(year, 11, 31));

  for (let date = new Date(firstDay); date <= lastDay; date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = formatIso(date);
    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidaySet.has(iso);
    const vacation = vacations.find((period) => iso >= period.start && iso <= period.end);
    const inVacation = Boolean(vacation);
    const vacationEstimated = vacation?.estimated === true;
    const isWednesdayRest = day === 3 && !inVacation && schoolWorkdaysPerWeek === 4;
    const isWorkday = !isWeekend && !isHoliday && !isWednesdayRest;
    const defaultHours = isWorkday
      ? (inVacation ? vacationWeeklyHours / 5 : schoolHoursByWeekday.get(day) ?? 0)
      : 0;

    calendar.push({
      date: iso,
      month: date.getUTCMonth(),
      isWeekend,
      isHoliday,
      inVacation,
      isWednesdayRest,
      isWorkday,
      defaultHours,
      vacationName: vacation?.name || null,
      vacationEstimated,
      isCp: false,
      isRtt: false,
    });
  }

  return calendar;
}

// Determine the CSS class for a calendar cell
export function getCalendarCellClass(day: CalendarDay, defaultClass: string): string {
  if (day.inVacation && day.vacationEstimated) {
    return day.isWeekend || day.isHoliday
      ? 'estimated-vacation-weekend-cell'
      : 'estimated-vacation-weekday-cell';
  }
  if (day.isWednesdayRest) {
    return 'wednesday-rest-cell';
  }
  if (day.isWeekend || day.isHoliday) {
    return 'offday-cell';
  }
  return defaultClass;
}