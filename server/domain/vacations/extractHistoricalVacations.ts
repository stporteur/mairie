import { VACATION_KEYS } from '../../../shared/vacations';
import type { HistoricalVacation, VacationKey } from '../../../shared/vacations';
import type { VacationPeriod } from '../../../shared/types/vacations';
import type { OfficialVacationsData } from './officialVacations';

const DAY_MS = 86_400_000;

function toKey(label: string): VacationKey | undefined {
  const plain = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return VACATION_KEYS.find((key) => new RegExp(`\\b${key}\\b`).test(plain));
}

function isNextDay(previousEnd: string, start: string): boolean {
  return Date.parse(`${start}T00:00:00Z`) - Date.parse(`${previousEnd}T00:00:00Z`) === DAY_MS;
}

/**
 * Converts the official zone C periods (split per calendar year) into complete history
 * periods: periods spanning two years (Christmas) are merged, and periods cut by the
 * bounds of the dataset are dropped because their real start or end is unknown.
 */
export function extractHistoricalVacations(official: OfficialVacationsData | null | undefined): HistoricalVacation[] {
  const years = official?.years;
  if (!years) return [];

  const yearKeys = Object.keys(years).sort();
  if (yearKeys.length === 0) return [];
  const firstYear = yearKeys[0];
  const lastYear = yearKeys[yearKeys.length - 1];

  const periods: VacationPeriod[] = yearKeys.flatMap((year) => {
    const entry = years[year];
    return (Array.isArray(entry) ? entry : entry?.C) ?? [];
  });

  const merged: HistoricalVacation[] = [];
  for (const period of periods.sort((a, b) => a.start.localeCompare(b.start))) {
    const name = toKey(period.name);
    if (!name) continue;
    const previous = merged[merged.length - 1];
    if (previous && previous.name === name && isNextDay(previous.end, period.start)) {
      previous.end = period.end;
    } else {
      merged.push({ name, start: period.start, end: period.end });
    }
  }

  return merged.filter(
    (period) => period.start !== `${firstYear}-01-01` && period.end !== `${lastYear}-12-31`,
  );
}
