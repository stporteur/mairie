export type PlanningTypeCode = 'STANDARD' | 'ATSEM';

export interface AtsemHours {
  holidayPeriodOffdays: string | null;
  holidayPeriodHours: number | null;
  schoolPeriodOffdays: string | null;
  schoolPeriodHours: number | null;
}

export interface StandardHours {
  weekHours: number | null;
}

/** A leave/working-time profile as exposed by the API. */
export interface ParameterProfile {
  id: number;
  name: string;
  planningType: PlanningTypeCode | null;
  holidays: number | null;
  rtt: number | null;
  atsem: AtsemHours | null;
  standard: StandardHours | null;
}
