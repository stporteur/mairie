import { buildEstimatedVacationPeriods, VacationPeriod } from '../shared/vacations';

export interface VacationSource {
  local?: boolean;
  estimated?: boolean;
  dataset?: string;
  resource?: {
    id?: string;
    title?: string;
    url?: string;
  };
}

export interface ResolvedVacations {
  vacations: VacationPeriod[];
  source: VacationSource;
}

type OfficialVacations = {
  years?: Record<string, { C?: VacationPeriod[] } | VacationPeriod[]>;
  source?: VacationSource;
} | null | undefined;

const vacationsByYear: Record<number, VacationPeriod[]> = {
  2026: [
    { name: "Noël fin d'année", start: '2026-01-01', end: '2026-01-05' },
    { name: "Vacances d'hiver", start: '2026-02-21', end: '2026-03-09' },
    { name: 'Vacances de printemps', start: '2026-04-11', end: '2026-04-27' },
    { name: 'Grandes vacances', start: '2026-07-04', end: '2026-08-31' },
    { name: 'Toussaint', start: '2026-10-17', end: '2026-11-02' },
    { name: "Noël fin d'année", start: '2026-12-19', end: '2026-12-31' },
  ],
  2027: [
    { name: "Noël fin d'année", start: '2027-01-01', end: '2027-01-04' },
    { name: "Vacances d'hiver", start: '2027-02-06', end: '2027-02-22' },
    { name: 'Vacances de printemps', start: '2027-04-10', end: '2027-04-26' },
    { name: 'Grandes vacances', start: '2027-07-03', end: '2027-08-31' },
    { name: 'Toussaint', start: '2027-10-16', end: '2027-11-01' },
    { name: "Noël fin d'année", start: '2027-12-18', end: '2027-12-31' },
  ],
  2025: [
    { name: "Noël fin d'année", start: '2025-01-01', end: '2025-01-05' },
    { name: "Vacances d'hiver", start: '2025-02-08', end: '2025-02-24' },
    { name: 'Vacances de printemps', start: '2025-04-12', end: '2025-04-28' },
    { name: 'Grandes vacances', start: '2025-07-05', end: '2025-08-31' },
    { name: 'Toussaint', start: '2025-10-18', end: '2025-11-03' },
    { name: "Noël fin d'année", start: '2025-12-20', end: '2025-12-31' },
  ],
};

export function isSupportedVacationYear(year: number): boolean {
  return Number.isInteger(year) && year >= 2020 && year <= 2059;
}

export function resolveVacationsForYear(
  year: number,
  official: OfficialVacations,
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

  const localPeriods = vacationsByYear[year];
  if (localPeriods) {
    return { vacations: localPeriods, source: { local: true } };
  }

  return {
    vacations: buildEstimatedVacationPeriods(year).map((period) => ({ ...period, estimated: true })),
    source: { estimated: true },
  };
}