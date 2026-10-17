import { VACATION_KEYWORDS } from '@/config/constants';
import { findVacationPeriods } from '../../vacations/findVacationPeriods';
import type { LeaveContext, LeaveRule } from '../LeaveRule';
import { isFreeWorkdayInVacation } from './workdaySelection';

function distanceInMs(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime());
}

/** Remaining RTT go to free vacation workdays, those closest to summer CP first. */
export class RttNearSummerCpRule implements LeaveRule {
  apply(context: LeaveContext): void {
    const { calendar, vacations, cpDates, rttDates, rttQuota } = context;
    const summerPeriods = findVacationPeriods(vacations, VACATION_KEYWORDS.SUMMER);
    const isSummerDay = (date: string) => summerPeriods.some((period) => date >= period.start && date <= period.end);
    const summerCpDates = [...cpDates].filter(isSummerDay)
      .filter((date) => calendar.some((day) => day.date === date));

    const candidates = calendar
      .filter((day) => isFreeWorkdayInVacation(context, day))
      .map((day) => ({
        day,
        priority: isSummerDay(day.date) && summerCpDates.length > 0
          ? summerCpDates.reduce((min, cpDate) => Math.min(min, distanceInMs(day.date, cpDate)), Infinity)
          : Infinity,
      }))
      .sort((a, b) => a.priority - b.priority)
      .map((entry) => entry.day);

    candidates.slice(0, rttQuota - rttDates.size).forEach((day) => rttDates.add(day.date));
  }
}
