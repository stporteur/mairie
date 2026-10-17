import type { ParameterProfile } from '@shared/types/parameters';
import { toWeekdayNumbers } from '@/domain/parameters/weekdays';
import { DEFAULT_PLANNING } from '@/domain/planning/createPlanningStrategy';
import type { PlanningDescriptor } from '@/domain/planning/types';
import type { LeaveProfile, LeaveProfiles } from '@/domain/settings/types';

function hours(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function toPlanning(parameter: ParameterProfile): PlanningDescriptor {
  if (parameter.planningType === 'STANDARD') {
    return { type: 'STANDARD', schoolRestDays: [], vacationRestDays: [] };
  }
  if (parameter.planningType === 'ATSEM') {
    return {
      type: 'ATSEM',
      schoolRestDays: toWeekdayNumbers(parameter.atsem?.schoolPeriodOffdays),
      vacationRestDays: toWeekdayNumbers(parameter.atsem?.holidayPeriodOffdays),
    };
  }
  return DEFAULT_PLANNING;
}

function toLeaveProfile(parameter: ParameterProfile): LeaveProfile {
  const isStandard = parameter.planningType === 'STANDARD';
  const standardHours = hours(parameter.standard?.weekHours);
  return {
    key: String(parameter.id),
    label: parameter.name,
    rttDays: hours(parameter.rtt),
    vacationWeeklyHours: isStandard ? standardHours : hours(parameter.atsem?.holidayPeriodHours),
    schoolWeeklyHours: isStandard ? standardHours : hours(parameter.atsem?.schoolPeriodHours),
    planning: toPlanning(parameter),
  };
}

/** Converts the profiles served by the API into the ones offered by the settings form. */
export function toLeaveProfiles(parameters: ParameterProfile[]): LeaveProfiles {
  return parameters.map(toLeaveProfile);
}
