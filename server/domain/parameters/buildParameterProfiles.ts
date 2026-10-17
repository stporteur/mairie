import type { ParameterProfile, PlanningTypeCode } from '../../../shared/types/parameters';
import type { Parameter, ParameterAtsem, ParameterStandard } from './types';

function toPlanningTypeCode(code: string | undefined): PlanningTypeCode | null {
  return code === 'STANDARD' || code === 'ATSEM' ? code : null;
}

/** Pure assembly of the API read model from the persisted rows. */
export function buildParameterProfiles(
  parameters: Parameter[],
  atsemRows: ParameterAtsem[],
  standardRows: ParameterStandard[],
): ParameterProfile[] {
  return parameters.map((parameter) => {
    const atsem = atsemRows.find((row) => row.parameter?.id === parameter.id);
    const standard = standardRows.find((row) => row.parameter?.id === parameter.id);
    return {
      id: parameter.id,
      name: parameter.name,
      planningTypeId: parameter.planningType?.id ?? null,
      planningType: toPlanningTypeCode(parameter.planningType?.code),
      holidays: parameter.holidays ?? null,
      rtt: parameter.rtt ?? null,
      atsem: atsem
        ? {
            holidayPeriodOffdays: atsem.holidayPeriodOffdays ?? null,
            holidayPeriodHours: atsem.holidayPeriodHours ?? null,
            schoolPeriodOffdays: atsem.schoolPeriodOffdays ?? null,
            schoolPeriodHours: atsem.schoolPeriodHours ?? null,
          }
        : null,
      standard: standard ? { weekHours: standard.weekHours ?? null } : null,
    };
  });
}
