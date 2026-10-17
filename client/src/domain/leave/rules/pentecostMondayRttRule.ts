import { getPentecostMonday } from '../../dates/easter';
import type { LeaveContext, LeaveRule } from '../LeaveRule';

/** The Pentecost Monday is an RTT day, unless already taken as CP. */
export class PentecostMondayRttRule implements LeaveRule {
  apply(context: LeaveContext): void {
    const { calendar, rttQuota, cpDates, rttDates } = context;
    const year = calendar.length ? Number(calendar[0].date.slice(0, 4)) : null;
    if (!year || rttQuota <= 0) return;

    const monday = getPentecostMonday(year);
    if (monday && !cpDates.has(monday)) rttDates.add(monday);
  }
}
