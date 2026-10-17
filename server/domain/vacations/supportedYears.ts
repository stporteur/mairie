export const MIN_SUPPORTED_VACATION_YEAR = 2020;
export const MAX_SUPPORTED_VACATION_YEAR = 2059;

export function isSupportedVacationYear(year: number): boolean {
  return Number.isInteger(year)
    && year >= MIN_SUPPORTED_VACATION_YEAR
    && year <= MAX_SUPPORTED_VACATION_YEAR;
}
