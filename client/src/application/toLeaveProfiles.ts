import type { ParameterProfile } from '@shared/types/parameters';
import type { LeaveProfile, LeaveProfiles } from '@/domain/settings/types';

const STANDARD_SCHOOL_WORKDAYS = 5;
const ATSEM_SCHOOL_WORKDAYS = 4;

function hours(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
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
    schoolWorkdaysPerWeek: isStandard ? STANDARD_SCHOOL_WORKDAYS : ATSEM_SCHOOL_WORKDAYS,
  };
}

/** Converts the profiles served by the API into the ones offered by the settings form. */
export function toLeaveProfiles(parameters: ParameterProfile[]): LeaveProfiles {
  return parameters.map(toLeaveProfile);
}
