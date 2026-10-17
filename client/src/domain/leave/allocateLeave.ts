import type { AllocatedCalendarDay, CalendarDay } from '../calendar/types';
import type { LeaveContext, LeaveRule, LeaveVacationPeriod } from './LeaveRule';
import { SmallVacationsCpRule, SummerVacationsCpRule } from './rules/cpInVacationsRules';
import { PentecostMondayRttRule } from './rules/pentecostMondayRttRule';
import { RemainingCpRule } from './rules/remainingCpRule';
import { RttNearSummerCpRule } from './rules/rttNearSummerCpRule';

export interface LeaveAllocation {
  calendar: AllocatedCalendarDay[];
  cpDates: Set<string>;
  rttDates: Set<string>;
}

const DEFAULT_CP_QUOTA = 25;
const DEFAULT_RTT_QUOTA = 9;

export const DEFAULT_LEAVE_RULES: readonly LeaveRule[] = [
  new SmallVacationsCpRule(),
  new SummerVacationsCpRule(),
  new PentecostMondayRttRule(),
  new RttNearSummerCpRule(),
  new RemainingCpRule(),
];

function toQuota(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

/** Allocates CP and RTT days by running the leave rules in order. */
export function allocateLeave(
  calendar: CalendarDay[],
  vacations: LeaveVacationPeriod[],
  cpTarget = DEFAULT_CP_QUOTA,
  rttTarget = DEFAULT_RTT_QUOTA,
  rules: readonly LeaveRule[] = DEFAULT_LEAVE_RULES,
): LeaveAllocation {
  const context: LeaveContext = {
    calendar,
    vacations,
    cpQuota: toQuota(cpTarget, DEFAULT_CP_QUOTA),
    rttQuota: toQuota(rttTarget, DEFAULT_RTT_QUOTA),
    cpDates: new Set<string>(),
    rttDates: new Set<string>(),
  };

  rules.forEach((rule) => rule.apply(context));

  const allocated: AllocatedCalendarDay[] = calendar.map((day) => {
    const isCp = context.cpDates.has(day.date);
    const isRtt = context.rttDates.has(day.date);
    return { ...day, isCp, isRtt, effectiveHours: isCp || isRtt ? 0 : day.defaultHours };
  });

  return { calendar: allocated, cpDates: context.cpDates, rttDates: context.rttDates };
}
