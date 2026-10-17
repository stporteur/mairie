import { CP_DAYS_PER_VACATION_PERIOD, VACATION_KEYWORDS } from '@/config/constants';
import { findVacationPeriods } from '../../vacations/findVacationPeriods';
import type { LeaveContext, LeaveRule } from '../LeaveRule';
import { pickWorkdaysInPeriods } from './workdaySelection';

/** CP in short school breaks (Christmas, winter, spring, All Saints), up to the quota. */
export class SmallVacationsCpRule implements LeaveRule {
  apply(context: LeaveContext): void {
    const periods = findVacationPeriods(context.vacations, VACATION_KEYWORDS.SMALL);
    pickWorkdaysInPeriods(context, periods, CP_DAYS_PER_VACATION_PERIOD, context.cpQuota)
      .forEach((date) => context.cpDates.add(date));
  }
}

/** CP in summer holidays with whatever quota remains. */
export class SummerVacationsCpRule implements LeaveRule {
  apply(context: LeaveContext): void {
    const periods = findVacationPeriods(context.vacations, VACATION_KEYWORDS.SUMMER);
    pickWorkdaysInPeriods(context, periods, CP_DAYS_PER_VACATION_PERIOD, context.cpQuota - context.cpDates.size)
      .forEach((date) => context.cpDates.add(date));
  }
}
