import { ANNUAL_HOURS_LIMIT } from '@/config/constants';
import type { TrainingCalendarDay } from '../calendar/types';

export interface AnnualSummary {
  cpCount: number;
  rttCount: number;
  totalLeave: number;
  totalWorkHours: number;
  totalTrainingHours: number;
  totalHours: number;
  hoursDue: number;
}

export interface AnnualWarnings {
  leaveMismatch: boolean;
  hoursExceeded: boolean;
}

export function sumWorkHours(calendar: { effectiveHours: number }[]): number {
  return calendar.reduce((total, day) => total + day.effectiveHours, 0);
}

export function summarizeYear(calendar: TrainingCalendarDay[], trainingByMonth: number[]): AnnualSummary {
  const totalTrainingHours = trainingByMonth.reduce((total, value) => total + Number(value || 0), 0);
  const totalWorkHours = sumWorkHours(calendar);
  const cpCount = calendar.filter((day) => day.isCp).length;
  const rttCount = calendar.filter((day) => day.isRtt).length;

  return {
    cpCount,
    rttCount,
    totalLeave: cpCount + rttCount,
    totalWorkHours,
    totalTrainingHours,
    totalHours: Number((totalWorkHours + totalTrainingHours).toFixed(2)),
    hoursDue: ANNUAL_HOURS_LIMIT - totalWorkHours,
  };
}

export function getAnnualWarnings(summary: AnnualSummary, expectedLeave: number): AnnualWarnings {
  return {
    leaveMismatch: summary.totalLeave !== expectedLeave,
    hoursExceeded: summary.totalHours > ANNUAL_HOURS_LIMIT,
  };
}
