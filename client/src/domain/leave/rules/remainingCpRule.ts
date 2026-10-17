import type { LeaveContext, LeaveRule } from '../LeaveRule';
import { isFreeWorkdayInVacation } from './workdaySelection';

/** Any CP still owed is placed on the first free vacation workdays. */
export class RemainingCpRule implements LeaveRule {
  apply(context: LeaveContext): void {
    const remaining = context.cpQuota - context.cpDates.size;
    if (remaining <= 0) return;

    context.calendar
      .filter((day) => isFreeWorkdayInVacation(context, day))
      .slice(0, remaining)
      .forEach((day) => context.cpDates.add(day.date));
  }
}
