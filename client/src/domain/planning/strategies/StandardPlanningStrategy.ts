import { WORKING_WEEKDAYS } from '../distributeHours';
import type { PlanningStrategy, WeeklyHours } from '../types';

/** Five worked days a week, the weekly hours spread evenly all year, vacations included. */
export class StandardPlanningStrategy implements PlanningStrategy {
  constructor(private readonly hours: WeeklyHours) {}

  isRestDay(): boolean {
    return false;
  }

  dailyHours(_weekday: number, inVacation: boolean): number {
    return (inVacation ? this.hours.vacation : this.hours.school) / WORKING_WEEKDAYS.length;
  }
}
