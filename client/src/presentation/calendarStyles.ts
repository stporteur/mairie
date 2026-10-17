import { WEEKDAY_INITIALS } from '@/config/constants';
import type { CalendarDay } from '@/domain/calendar/types';

type DayLike = Pick<CalendarDay, 'date' | 'inVacation' | 'vacationEstimated' | 'isWeekend' | 'isHoliday' | 'isWednesdayRest'>;

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function getWeekdayInitial(date: string): string {
  return WEEKDAY_INITIALS[weekdayOf(date)];
}

export function getDayHeaderClass(day: DayLike): string {
  if (!day.inVacation) return '';
  return day.vacationEstimated ? 'vacation-day-header estimated-vacation-day-header' : 'vacation-day-header';
}

function getBaseCellClass(day: DayLike): string {
  if (day.inVacation) return day.isWeekend ? 'vacation-weekend-cell' : 'vacation-weekday-cell';
  const weekday = weekdayOf(day.date);
  return weekday === 0 || weekday === 6 || weekday === 3 ? 'normal-gray-cell' : 'normal-white-cell';
}

export function getCalendarCellClass(day: DayLike): string {
  if (day.inVacation && day.vacationEstimated) {
    return day.isWeekend || day.isHoliday
      ? 'estimated-vacation-weekend-cell'
      : 'estimated-vacation-weekday-cell';
  }
  if (day.isWednesdayRest) return 'wednesday-rest-cell';
  if (day.isWeekend || day.isHoliday) return 'offday-cell';
  return getBaseCellClass(day);
}
