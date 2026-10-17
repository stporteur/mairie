import type { VacationsResponse } from '@shared/types/vacations';
import type { VacationsGateway } from '@/ports/VacationsGateway';

export class HttpVacationsGateway implements VacationsGateway {
  async fetchVacations(year: number): Promise<VacationsResponse> {
    try {
      const response = await fetch(`/api/vacations/${year}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return await response.json() as VacationsResponse;
    } catch (error) {
      console.error('Erreur lors du chargement des vacances:', error);
      throw error;
    }
  }
}
