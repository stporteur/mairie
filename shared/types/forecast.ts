export interface ForecastSummaryRow {
  year: number;
  cpDays: number;
  rttDays: number;
  totalLeave: number;
  workHours: number;
  hoursDue: number;
}

export interface ForecastExportRequest {
  startYear: number;
  profile: string;
  rows: ForecastSummaryRow[];
}

export interface ForecastComparisonProfile {
  label: string;
  /** Leave and weekly hours, as displayed under the profile name. */
  description: string;
  rows: ForecastSummaryRow[];
}

export interface ForecastComparisonExportRequest {
  startYear: number;
  profiles: ForecastComparisonProfile[];
}
