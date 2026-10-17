import type { VacationPeriod, VacationSource } from '@shared/types/vacations';
import { loadPreparedVacations } from '@/application/loadPreparedVacations';
import type { VacationsGateway } from '@/ports/VacationsGateway';
import type { StateSetter } from '../types';

export interface LoadVacationsDeps {
  gateway: VacationsGateway;
  setVacations: StateSetter<VacationPeriod[]>;
  setSource: StateSetter<VacationSource | null>;
}

export function createLoadVacations({ gateway, setVacations, setSource }: LoadVacationsDeps) {
  return async (year: number): Promise<void> => {
    try {
      const { vacations, source } = await loadPreparedVacations(gateway, year);
      setSource(source);
      setVacations(vacations);
    } catch (error) {
      console.error('Erreur lors du chargement des vacances:', error);
      setVacations([]);
      setSource(null);
    }
  };
}
