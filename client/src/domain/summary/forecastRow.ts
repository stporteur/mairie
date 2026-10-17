import { ANNUAL_HOURS_LIMIT } from '@/config/constants';
import type { ForecastSummaryRow } from '@shared/types/forecast';
import type { LeaveAllocation } from '../leave/allocateLeave';
import { sumWorkHours } from './annualSummary';

export function buildForecastRow(year: number, allocation: LeaveAllocation): ForecastSummaryRow {
  const workHours = sumWorkHours(allocation.calendar);
  const cpDays = allocation.cpDates.size;
  const rttDays = allocation.rttDates.size;

  return {
    year,
    cpDays,
    rttDays,
    totalLeave: cpDays + rttDays,
    workHours: Number(workHours.toFixed(2)),
    hoursDue: Number((ANNUAL_HOURS_LIMIT - workHours).toFixed(2)),
  };
}
