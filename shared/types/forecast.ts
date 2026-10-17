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
