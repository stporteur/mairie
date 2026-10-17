import type { HolidayProvider } from '@/ports/HolidayProvider';
import { formatIso } from '../dates/iso';
import type { PlanningStrategy } from '../planning/types';
import type { CalendarDay } from './types';

export interface CalendarVacation {
  name: string;
  start: string;
  end: string;
  estimated?: boolean;
}

export interface CalendarOptions {
  year: number;
  vacations: CalendarVacation[];
  strategy: PlanningStrategy;
}

export function buildYearCalendar(options: CalendarOptions, holidayProvider: HolidayProvider): CalendarDay[] {
  const { year, vacations, strategy } = options;
  const holidays = holidayProvider.getHolidays(year);
  const calendar: CalendarDay[] = [];
  const lastDay = new Date(Date.UTC(year, 11, 31));

  for (let date = new Date(Date.UTC(year, 0, 1)); date <= lastDay; date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = formatIso(date);
    const weekday = date.getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isHoliday = holidays.has(iso);
    const vacation = vacations.find((period) => iso >= period.start && iso <= period.end);
    const inVacation = Boolean(vacation);
    const isRestDay = !isWeekend && strategy.isRestDay(weekday, inVacation);
    const isWorkday = !isWeekend && !isHoliday && !isRestDay;
    const defaultHours = isWorkday ? strategy.dailyHours(weekday, inVacation) : 0;

    calendar.push({
      date: iso,
      month: date.getUTCMonth(),
      isWeekend,
      isHoliday,
      inVacation,
      isRestDay,
      isWorkday,
      defaultHours,
      vacationName: vacation?.name || null,
      vacationEstimated: vacation?.estimated === true,
      isCp: false,
      isRtt: false,
    });
  }

  return calendar;
}
