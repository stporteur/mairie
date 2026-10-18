import { WEEKDAY_INITIALS } from '@/config/constants';
import type { CalendarDay } from '@/domain/calendar/types';

type DayLike = Pick<CalendarDay, 'date' | 'inVacation' | 'vacationEstimated' | 'isWeekend' | 'isHoliday' | 'isRestDay'>;

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
  return day.isWeekend ? 'normal-gray-cell' : 'normal-white-cell';
}

export function getCalendarCellClass(day: DayLike): string {
  if (day.isHoliday) return 'holiday-cell';
  if (day.inVacation && day.vacationEstimated) {
    return day.isWeekend
      ? 'estimated-vacation-weekend-cell'
      : 'estimated-vacation-weekday-cell';
  }
  if (day.isRestDay) return 'rest-day-cell';
  if (day.isWeekend) return 'offday-cell';
  return getBaseCellClass(day);
}
