import { buildEstimatedVacationPeriods } from '../../../shared/vacations';
import type { ResolvedVacations } from '../../../shared/types/vacations';
import { LOCAL_VACATIONS_BY_YEAR } from './localVacations';
import type { OfficialVacationsData } from './officialVacations';

export function resolveVacationsForYear(
  year: number,
  official: OfficialVacationsData | null | undefined,
): ResolvedVacations {
  const officialYear = official?.years?.[year];
  const officialPeriods = Array.isArray(officialYear) ? officialYear : officialYear?.C;

  if (Array.isArray(officialPeriods)) {
    const estimatedPeriods = buildEstimatedVacationPeriods(year)
      .filter((estimate) => !officialPeriods.some(
        (period) => period.start <= estimate.end && period.end >= estimate.start,
      ))
      .map((period) => ({ ...period, estimated: true }));

    return {
      vacations: [
        ...officialPeriods.map((period) => ({ ...period, estimated: false })),
        ...estimatedPeriods,
      ],
      source: {
        ...official?.source,
        ...(estimatedPeriods.length > 0 ? { estimated: true } : {}),
      },
    };
  }

  const localPeriods = LOCAL_VACATIONS_BY_YEAR[year];
  if (localPeriods) {
    return { vacations: localPeriods, source: { local: true } };
  }

  return {
    vacations: buildEstimatedVacationPeriods(year).map((period) => ({ ...period, estimated: true })),
    source: { estimated: true },
  };
}
