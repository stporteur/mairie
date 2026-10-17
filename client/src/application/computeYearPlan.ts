import type { VacationPeriod } from '@shared/types/vacations';
import type { HolidayProvider } from '@/ports/HolidayProvider';
import { buildYearCalendar } from '@/domain/calendar/buildYearCalendar';
import type { TrainingCalendarDay } from '@/domain/calendar/types';
import { allocateLeave, type LeaveAllocation } from '@/domain/leave/allocateLeave';
import { createPlanningStrategy } from '@/domain/planning/createPlanningStrategy';
import type { LeaveParameters } from '@/domain/settings/types';
import { allocateTraining } from '@/domain/training/allocateTraining';

export function allocateYearLeave(
  year: number,
  vacations: VacationPeriod[],
  parameters: LeaveParameters,
  holidays: HolidayProvider,
): LeaveAllocation {
  const strategy = createPlanningStrategy(parameters.planning, {
    school: parameters.schoolWeeklyHours,
    vacation: parameters.vacationWeeklyHours,
  });
  const calendar = buildYearCalendar({ year, vacations, strategy }, holidays);
  return allocateLeave(calendar, vacations, parameters.cpQuota, parameters.rttQuota);
}

/** Full-year planning (calendar, leave and training), or null when there is no vacation data. */
export function computeYearPlan(
  year: number,
  vacations: VacationPeriod[],
  parameters: LeaveParameters,
  trainingByMonth: number[],
  holidays: HolidayProvider,
): TrainingCalendarDay[] | null {
  if (!vacations.length) return null;
  const allocation = allocateYearLeave(year, vacations, parameters, holidays);
  return allocateTraining(allocation.calendar, trainingByMonth);
}
