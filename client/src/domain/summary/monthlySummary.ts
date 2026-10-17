import { monthNames } from '@/config/constants';
import type { TrainingCalendarDay } from '../calendar/types';

export interface MonthlySummary {
  monthName: string;
  workHours: number;
  trainingHours: number;
  cpDays: number;
  rttDays: number;
  vacationDays: number;
}

function sumRounded(values: number[]): number {
  return Number(values.reduce((sum, value) => sum + value, 0).toFixed(2));
}

export function groupByMonth(calendar: TrainingCalendarDay[]): TrainingCalendarDay[][] {
  return monthNames.map((_, monthIndex) => calendar.filter((day) => day.month === monthIndex));
}

export function summarizeMonths(calendar: TrainingCalendarDay[]): MonthlySummary[] {
  return groupByMonth(calendar).map((days, monthIndex) => ({
    monthName: monthNames[monthIndex],
    workHours: sumRounded(days.map((day) => day.effectiveHours)),
    trainingHours: sumRounded(days.map((day) => day.trainingHours)),
    cpDays: days.filter((day) => day.isCp).length,
    rttDays: days.filter((day) => day.isRtt).length,
    vacationDays: days.filter((day) => day.inVacation && day.isWorkday && !day.isCp && !day.isRtt).length,
  }));
}
