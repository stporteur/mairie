import type { VacationPeriod, VacationsResponse } from '@shared/types/vacations';
import { adjustVacationDates } from './adjustVacationDates';

/** Keeps school vacations only, flags estimated ones, and aligns dates on the school calendar. */
export function prepareVacations(
  response: Pick<VacationsResponse, 'vacations' | 'source'>,
  year: number,
): VacationPeriod[] {
  const vacations = (response.vacations ?? [])
    .filter((vacation) => vacation.name?.toLowerCase().includes('vacances'))
    .map((vacation) => ({
      ...vacation,
      estimated: vacation.estimated ?? response.source?.estimated === true,
    }));

  return adjustVacationDates(vacations, year);
}
