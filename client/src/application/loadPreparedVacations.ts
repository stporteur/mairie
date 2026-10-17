import type { VacationPeriod, VacationSource } from '@shared/types/vacations';
import type { VacationsGateway } from '@/ports/VacationsGateway';
import { prepareVacations } from '@/domain/vacations/prepareVacations';

export interface PreparedVacations {
  vacations: VacationPeriod[];
  source: VacationSource | null;
}

export async function loadPreparedVacations(
  gateway: VacationsGateway,
  year: number,
): Promise<PreparedVacations> {
  const response = await gateway.fetchVacations(year);
  return {
    vacations: prepareVacations(response, year),
    source: response.source || null,
  };
}
