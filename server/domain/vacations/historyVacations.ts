import type { VacationPeriod } from '../../../shared/types/vacations';
import type { HistoricalVacation, VacationKey } from '../../../shared/vacations';

const LABELS: Record<VacationKey, string> = {
  noel: 'Vacances de Noël',
  hiver: 'Vacances d’hiver',
  printemps: 'Vacances de printemps',
  ete: 'Grandes vacances',
  toussaint: 'Vacances de la Toussaint',
};

function labelFor(key: VacationKey, year: number, start: string, end: string): string {
  if (key !== 'noel') return LABELS[key];
  if (start.slice(0, 4) < String(year)) return `${LABELS.noel} (début d’année)`;
  if (end.slice(0, 4) > String(year)) return `${LABELS.noel} (fin d’année)`;
  return LABELS.noel;
}

/** Stored periods that overlap the year, clipped to it like the official data. */
export function historyPeriodsForYear(year: number, history: readonly HistoricalVacation[]): VacationPeriod[] {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  return history
    .filter((period) => period.start <= yearEnd && period.end >= yearStart && period.name in LABELS)
    .map((period) => ({
      name: labelFor(period.name as VacationKey, year, period.start, period.end),
      start: period.start < yearStart ? yearStart : period.start,
      end: period.end > yearEnd ? yearEnd : period.end,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** True when every kind of holiday is stored for the year. */
export function isYearCoveredByHistory(year: number, history: readonly HistoricalVacation[]): boolean {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const keys = new Set(
    history.filter((period) => period.start <= yearEnd && period.end >= yearStart).map((period) => period.name),
  );
  return (Object.keys(LABELS) as VacationKey[]).every((key) => keys.has(key));
}
