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

/** A planning type, which decides the table holding the profile's hours. */
export interface PlanningTypeOption {
  id: number;
  code: string;
  name: string;
}

/** What a client sends to create or replace a profile. */
export interface ParameterInput {
  name: string;
  holidays: number | null;
  rtt: number | null;
  planningTypeId: number | null;
  atsem: AtsemHours | null;
  standard: StandardHours | null;
}

/** A leave/working-time profile as exposed by the API. */
export interface ParameterProfile {
  id: number;
  name: string;
  planningTypeId: number | null;
  planningType: PlanningTypeCode | null;
  holidays: number | null;
  rtt: number | null;
  atsem: AtsemHours | null;
  standard: StandardHours | null;
}
