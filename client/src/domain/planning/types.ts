import type { PlanningTypeCode } from '@shared/types/parameters';

/** Weekday numbers follow `Date#getUTCDay`: 0 = Sunday … 6 = Saturday. */
export type WeekdayNumber = number;

/** What a profile says about its working week, independently of the hours it grants. */
export interface PlanningDescriptor {
  type: PlanningTypeCode;
  schoolRestDays: readonly WeekdayNumber[];
  vacationRestDays: readonly WeekdayNumber[];
}

export interface WeeklyHours {
  school: number;
  vacation: number;
}

/** How one planning type turns a weekday into a rest day and into default worked hours. */
export interface PlanningStrategy {
  isRestDay(weekday: WeekdayNumber, inVacation: boolean): boolean;
  dailyHours(weekday: WeekdayNumber, inVacation: boolean): number;
}
