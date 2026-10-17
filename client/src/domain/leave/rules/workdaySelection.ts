import type { CalendarDay } from '../../calendar/types';
import type { LeaveContext, LeaveVacationPeriod } from '../LeaveRule';

export function isFreeWorkdayInVacation(context: LeaveContext, day: CalendarDay): boolean {
  return day.inVacation && day.isWorkday && !context.cpDates.has(day.date) && !context.rttDates.has(day.date);
}

/** Picks up to `perPeriod` free workdays in each period, without exceeding `maxTotal` overall. */
export function pickWorkdaysInPeriods(
  context: LeaveContext,
  periods: LeaveVacationPeriod[],
  perPeriod: number,
  maxTotal: number,
): string[] {
  const picked: string[] = [];
  periods.forEach((period) => {
    const candidates = context.calendar.filter((day) =>
      day.month !== 0 &&
      day.date >= period.start &&
      day.date <= period.end &&
      day.isWorkday &&
      !context.cpDates.has(day.date) &&
      !context.rttDates.has(day.date));
    const count = Math.min(perPeriod, candidates.length, maxTotal - picked.length);
    for (let i = 0; i < count; i += 1) picked.push(candidates[i].date);
  });
  return picked;
}
