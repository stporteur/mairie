import type { HistoricalVacation } from '../../../shared/vacations';
import { buildEstimatedVacationPeriods } from '../../../shared/vacations';
import type { ResolvedVacations, VacationPeriod } from '../../../shared/types/vacations';
import { historyPeriodsForYear } from './historyVacations';
import type { OfficialVacationsData } from './officialVacations';

const overlaps = (a: VacationPeriod, b: VacationPeriod) => a.start <= b.end && a.end >= b.start;

function keepNew(candidates: VacationPeriod[], existing: VacationPeriod[]): VacationPeriod[] {
  return candidates.filter((candidate) => !existing.some((period) => overlaps(period, candidate)));
}

/** Priority: stored history, then official sources, then the estimate for what is still missing. */
export function resolveVacationsForYear(
  year: number,
  official: OfficialVacationsData | null | undefined,
  history: readonly HistoricalVacation[] = [],
): ResolvedVacations {
  const officialYear = official?.years?.[year];
  const officialList = Array.isArray(officialYear) ? officialYear : officialYear?.C;

  const stored = historyPeriodsForYear(year, history);
  const fromOfficial = keepNew(Array.isArray(officialList) ? officialList : [], stored);
  const estimated = keepNew(buildEstimatedVacationPeriods(year, history), [...stored, ...fromOfficial]);

  const vacations = [
    ...stored.map((period) => ({ ...period, estimated: false })),
    ...fromOfficial.map((period) => ({ ...period, estimated: false })),
    ...estimated.map((period) => ({ ...period, estimated: true })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  return {
    vacations,
    source: {
      ...(fromOfficial.length > 0 || stored.length === 0 ? official?.source : undefined),
      ...(stored.length > 0 ? { local: true } : {}),
      ...(estimated.length > 0 ? { estimated: true } : {}),
    },
  };
}
