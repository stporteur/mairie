export interface PlanningType {
  id: number;
  code: string;
  name: string;
}

export interface Parameter {
  id: number;
  name: string;
  holidays?: number | null;
  rtt?: number | null;
  planningType?: PlanningType | null;
}

export interface ParameterAtsem {
  id: number;
  parameter?: Parameter | null;
  holidayPeriodOffdays?: string | null;
  holidayPeriodHours?: number | null;
  schoolPeriodOffdays?: string | null;
  schoolPeriodHours?: number | null;
}

export interface ParameterStandard {
  id: number;
  parameter?: Parameter | null;
  weekHours?: number | null;
}
