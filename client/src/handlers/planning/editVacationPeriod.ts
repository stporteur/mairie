import type { VacationPeriod } from '@shared/types/vacations';
import type { StateSetter } from '../types';

const DAY_MS = 86_400_000;
const SUNDAY = 0;
const AUTO_END_PATTERN = /no[eë]l|hiver|printemps|toussaint/i;

/** The Sunday on or after the date two weeks later. */
function sundayTwoWeeksAfter(isoStart: string): string | null {
  const start = Date.parse(`${isoStart}T00:00:00Z`);
  if (Number.isNaN(start)) return null;
  const twoWeeks = new Date(start + 14 * DAY_MS);
  const end = new Date(twoWeeks.getTime() + ((SUNDAY - twoWeeks.getUTCDay() + 7) % 7) * DAY_MS);
  return end.toISOString().slice(0, 10);
}

export function createEditVacationPeriod(deps: { setVacations: StateSetter<VacationPeriod[]> }) {
  return (index: number, field: 'start' | 'end', value: string): void => {
    deps.setVacations((current) => {
      const next = [...current];
      const period = { ...next[index], [field]: value.slice(0, 10) };
      if (field === 'start' && AUTO_END_PATTERN.test(period.name) && !/début/i.test(period.name)) {
        period.end = sundayTwoWeeksAfter(period.start) ?? period.end;
      }
      next[index] = period;
      return next;
    });
  };
}
