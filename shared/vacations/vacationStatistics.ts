import { parseIsoDate } from '../dates/iso';
import { VACATION_KEYS, type HistoricalVacation, type VacationKey } from './vacationHistory';

/**
 * Holidays have followed the same pattern since 2012 (two weeks from Saturday to Sunday,
 * Toussaint lengthened to two weeks), older years would skew the statistics.
 */
export const STATISTICS_FROM_YEAR = 2012;

const DAY_MS = 86_400_000;

export interface VacationStatistic {
  /** Average number of days between January 1st and the start of the period. */
  meanStartOffset: number;
  /** Typical length in days, both bounds included. */
  medianLength: number;
}

export type VacationStatistics = Partial<Record<VacationKey, VacationStatistic>>;

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

/** Summarises when each kind of holiday usually starts and how long it lasts. */
export function computeVacationStatistics(
  history: readonly HistoricalVacation[],
  fromYear: number = STATISTICS_FROM_YEAR,
): VacationStatistics {
  const statistics: VacationStatistics = {};

  for (const key of VACATION_KEYS) {
    const periods = history.filter((period) => period.name === key && Number(period.start.slice(0, 4)) >= fromYear);
    if (periods.length === 0) continue;

    const offsets = periods.map((period) => {
      const start = parseIsoDate(period.start);
      return daysBetween(new Date(Date.UTC(start.getUTCFullYear(), 0, 1)), start);
    });
    const lengths = periods.map((period) => daysBetween(parseIsoDate(period.start), parseIsoDate(period.end)) + 1);

    statistics[key] = {
      meanStartOffset: offsets.reduce((sum, offset) => sum + offset, 0) / offsets.length,
      medianLength: median(lengths),
    };
  }

  return statistics;
}
