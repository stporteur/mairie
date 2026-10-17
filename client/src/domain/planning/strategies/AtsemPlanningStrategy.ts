import { distributeQuarterHours, workdaysExcluding } from '../distributeHours';
import type { PlanningDescriptor, PlanningStrategy, WeekdayNumber, WeeklyHours } from '../types';

/** Tuesday and Thursday get the leftover quarter hours first, then Monday, Friday and Wednesday. */
const EXTRA_QUARTER_HOUR_PRIORITY: readonly WeekdayNumber[] = [2, 4, 1, 5, 3];

/**
 * Rest days come from the profile, one set during the school period and one during vacations.
 * School hours are split in quarter hours over the days worked; vacation hours evenly.
 */
export class AtsemPlanningStrategy implements PlanningStrategy {
  private readonly schoolRestDays: ReadonlySet<WeekdayNumber>;
  private readonly vacationRestDays: ReadonlySet<WeekdayNumber>;
  private readonly schoolHours: Map<WeekdayNumber, number>;
  private readonly vacationDailyHours: number;

  constructor(descriptor: PlanningDescriptor, hours: WeeklyHours) {
    this.schoolRestDays = new Set(descriptor.schoolRestDays);
    this.vacationRestDays = new Set(descriptor.vacationRestDays);
    this.schoolHours = distributeQuarterHours(hours.school, workdaysExcluding(this.schoolRestDays), EXTRA_QUARTER_HOUR_PRIORITY);
    const vacationWorkdays = workdaysExcluding(this.vacationRestDays);
    this.vacationDailyHours = vacationWorkdays.length > 0 ? hours.vacation / vacationWorkdays.length : 0;
  }

  isRestDay(weekday: WeekdayNumber, inVacation: boolean): boolean {
    return (inVacation ? this.vacationRestDays : this.schoolRestDays).has(weekday);
  }

  dailyHours(weekday: WeekdayNumber, inVacation: boolean): number {
    if (this.isRestDay(weekday, inVacation)) return 0;
    return inVacation ? this.vacationDailyHours : this.schoolHours.get(weekday) ?? 0;
  }
}
