import type { HolidayProvider } from '@/ports/HolidayProvider';
import { formatIso } from '../dates/iso';
import type { CalendarDay } from './types';
import { getSchoolHoursByWeekday } from './schoolHours';

export interface CalendarVacation {
  name: string;
  start: string;
  end: string;
  estimated?: boolean;
}

export interface CalendarOptions {
  year: number;
  vacations: CalendarVacation[];
  vacationWeeklyHours: number;
  schoolWeeklyHours: number;
  schoolWorkdaysPerWeek: number;
}

const WORKDAYS_PER_VACATION_WEEK = 5;

export function buildYearCalendar(options: CalendarOptions, holidayProvider: HolidayProvider): CalendarDay[] {
  const { year, vacations, vacationWeeklyHours, schoolWeeklyHours, schoolWorkdaysPerWeek } = options;
  const holidays = holidayProvider.getHolidays(year);
  const schoolHoursByWeekday = getSchoolHoursByWeekday(schoolWeeklyHours, schoolWorkdaysPerWeek);
  const calendar: CalendarDay[] = [];
  const lastDay = new Date(Date.UTC(year, 11, 31));

  for (let date = new Date(Date.UTC(year, 0, 1)); date <= lastDay; date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = formatIso(date);
    const weekday = date.getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isHoliday = holidays.has(iso);
    const vacation = vacations.find((period) => iso >= period.start && iso <= period.end);
    const inVacation = Boolean(vacation);
    const isWednesdayRest = weekday === 3 && !inVacation && schoolWorkdaysPerWeek === 4;
    const isWorkday = !isWeekend && !isHoliday && !isWednesdayRest;
    const defaultHours = isWorkday
      ? (inVacation ? vacationWeeklyHours / WORKDAYS_PER_VACATION_WEEK : schoolHoursByWeekday.get(weekday) ?? 0)
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
      vacationEstimated: vacation?.estimated === true,
      isCp: false,
      isRtt: false,
    });
  }

  return calendar;
}
