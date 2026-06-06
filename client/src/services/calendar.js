import { formatIso } from '../utils/date';
import { createHolidaySet } from './vacations';

// Build a year calendar with workdays, holidays, and vacations
export function buildYearCalendar(year, vacations) {
  const holidaySet = createHolidaySet(year);
  const calendar = [];
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const lastDay = new Date(Date.UTC(year, 11, 31));

  for (let date = new Date(firstDay); date <= lastDay; date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = formatIso(date);
    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidaySet.has(iso);
    const inVacation = vacations.some((vacation) => iso >= vacation.start && iso <= vacation.end);
    const isWednesdayRest = day === 3 && !inVacation;
    const isWorkday = !isWeekend && !isHoliday && !isWednesdayRest;
    const defaultHours = isWorkday ? (inVacation ? 7 : 9.25) : 0;

    calendar.push({
      date: iso,
      month: date.getUTCMonth(),
      isWeekend,
      isHoliday,
      inVacation,
      isWednesdayRest,
      isWorkday,
      defaultHours,
      vacationName: vacations.find((vacation) => iso >= vacation.start && iso <= vacation.end)?.name || null,
      isCp: false,
      isRtt: false,
    });
  }

  return calendar;
}

// Determine the CSS class for a calendar cell
export function getCalendarCellClass(day, defaultClass) {
  if (day.isWednesdayRest) {
    return 'wednesday-rest-cell';
  }
  if (day.isWeekend || day.isHoliday) {
    return 'offday-cell';
  }
  return defaultClass;
}