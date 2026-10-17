import type { VacationsResponse } from '@shared/types/vacations';

export interface VacationsGateway {
  fetchVacations(year: number): Promise<VacationsResponse>;
}
