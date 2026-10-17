export interface CalendarDay {
  date: string;
  month: number;
  isWeekend: boolean;
  isHoliday: boolean;
  inVacation: boolean;
  isRestDay: boolean;
  isWorkday: boolean;
  defaultHours: number;
  vacationName: string | null;
  vacationEstimated: boolean;
  isCp: boolean;
  isRtt: boolean;
}

export interface AllocatedCalendarDay extends CalendarDay {
  effectiveHours: number;
}

export interface TrainingCalendarDay extends AllocatedCalendarDay {
  trainingHours: number;
}
