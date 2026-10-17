import type { CalendarDay } from '../calendar/types';

export interface LeaveVacationPeriod {
  name: string;
  start: string;
  end: string;
}

/** Mutable state shared by the rules while leave is being allocated. */
export interface LeaveContext {
  calendar: CalendarDay[];
  vacations: LeaveVacationPeriod[];
  cpQuota: number;
  rttQuota: number;
  cpDates: Set<string>;
  rttDates: Set<string>;
}

/** One step of the allocation; rules run in order and refine the context. */
export interface LeaveRule {
  apply(context: LeaveContext): void;
}
