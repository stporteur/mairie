import type { VacationPeriod } from '@shared/types/vacations';
import type { StateSetter } from '../types';

export function createEditVacationPeriod(deps: { setVacations: StateSetter<VacationPeriod[]> }) {
  return (index: number, field: 'start' | 'end', value: string): void => {
    deps.setVacations((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value.slice(0, 10) };
      return next;
    });
  };
}
