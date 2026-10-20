import { STATISTICS_FROM_YEAR } from './vacationStatistics';

/** Years supported after the current year. */
export const SUPPORTED_YEARS_AFTER = 50;

/** First year of the usable vacation history. */
export function minSupportedYear(): number {
  return STATISTICS_FROM_YEAR;
}

export function maxSupportedYear(now: Date = new Date()): number {
  return now.getFullYear() + SUPPORTED_YEARS_AFTER;
}

export function isSupportedYear(year: number, now: Date = new Date()): boolean {
  return Number.isInteger(year) && year >= minSupportedYear() && year <= maxSupportedYear(now);
}
