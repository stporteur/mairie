export { maxSupportedYear, minSupportedYear } from '@shared/vacations/supportedYears';

export function currentYear(): number {
  return new Date().getFullYear();
}
