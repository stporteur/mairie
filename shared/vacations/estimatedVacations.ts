import { formatIsoDate } from '../dates/iso';
import type { VacationPeriod } from '../types/vacations';
import type { HistoricalVacation, VacationKey } from './vacationHistory';
import { computeVacationStatistics, type VacationStatistics } from './vacationStatistics';

const DAY_MS = 86_400_000;
const SATURDAY = 6;
/** Saturday to Sunday over two weeks, used when the history gives no length for Christmas. */
const DEFAULT_CHRISTMAS_LENGTH = 16;
const SUMMER_END_MONTH_DAY = '08-31';

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function saturdayOnOrAfter(date: Date): Date {
  return addDays(date, (SATURDAY - date.getUTCDay() + 7) % 7);
}

function nearestSaturday(date: Date): Date {
  const forward = (SATURDAY - date.getUTCDay() + 7) % 7;
  return addDays(date, forward <= 3 ? forward : forward - 7);
}

/** Holidays that move from one year to the next: placed on the Saturday closest to their usual start. */
function statisticalPeriod(
  name: string,
  key: Exclude<VacationKey, 'noel' | 'ete'>,
  year: number,
  statistics: VacationStatistics,
): VacationPeriod | null {
  const statistic = statistics[key];
  if (!statistic) return null;

  const usualStart = addDays(new Date(Date.UTC(year, 0, 1)), Math.round(statistic.meanStartOffset));
  const start = nearestSaturday(usualStart);
  return { name, start: formatIsoDate(start), end: formatIsoDate(addDays(start, statistic.medianLength - 1)) };
}

/** Christmas always contains December 25th and January 1st: it starts on the Saturday between the 17th and 23rd. */
function christmas(year: number, statistics: VacationStatistics): { start: Date; end: Date } {
  const start = saturdayOnOrAfter(new Date(Date.UTC(year, 11, 17)));
  const length = statistics.noel?.medianLength ?? DEFAULT_CHRISTMAS_LENGTH;
  return { start, end: addDays(start, length - 1) };
}

/** Summer holidays start on the first Saturday of July and end when school restarts in September. */
function summer(year: number): VacationPeriod {
  return {
    name: 'Grandes vacances',
    start: formatIsoDate(saturdayOnOrAfter(new Date(Date.UTC(year, 6, 1)))),
    end: `${year}-${SUMMER_END_MONTH_DAY}`,
  };
}

function christmasStartingLastYear(year: number, statistics: VacationStatistics): VacationPeriod | null {
  const { end } = christmas(year - 1, statistics);
  if (end.getUTCFullYear() < year) return null;
  return { name: 'Vacances de Noël (début d’année)', start: `${year}-01-01`, end: formatIsoDate(end) };
}

function christmasEndingThisYear(year: number, statistics: VacationStatistics): VacationPeriod {
  const { start, end } = christmas(year, statistics);
  const lastDay = new Date(Date.UTC(year, 11, 31));
  return {
    name: 'Vacances de Noël (fin d’année)',
    start: formatIsoDate(start),
    end: formatIsoDate(end > lastDay ? lastDay : end),
  };
}

/**
 * Estimates the holidays of a year that has no official data, from the statistics of the history.
 * Periods are clipped to the year, like the official data. Without history, only the periods
 * that follow a fixed rule (Christmas and summer) are returned.
 */
export function buildEstimatedVacationPeriods(
  year: number,
  history: readonly HistoricalVacation[] = [],
): VacationPeriod[] {
  const statistics = computeVacationStatistics(history);

  return [
    christmasStartingLastYear(year, statistics),
    statisticalPeriod('Vacances d’hiver', 'hiver', year, statistics),
    statisticalPeriod('Vacances de printemps', 'printemps', year, statistics),
    summer(year),
    statisticalPeriod('Vacances de la Toussaint', 'toussaint', year, statistics),
    christmasEndingThisYear(year, statistics),
  ].filter((period): period is VacationPeriod => period !== null);
}
