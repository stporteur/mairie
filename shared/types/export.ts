export interface ExportCalendarDay {
  date: string;
  effectiveHours: number;
  isWeekend: boolean;
  isHoliday: boolean;
  inVacation: boolean;
  vacationEstimated: boolean;
  isWednesdayRest: boolean;
  isCp: boolean;
  isRtt: boolean;
}

export interface ExportCalendarRequest {
  year: number;
  profile: string;
  days: ExportCalendarDay[];
}
