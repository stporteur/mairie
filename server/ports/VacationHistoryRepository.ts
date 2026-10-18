import type { HistoricalVacation } from '../../shared/vacations';

export interface VacationHistoryRepository {
  /** Every past holiday period, oldest first. */
  findAll(): Promise<HistoricalVacation[]>;
  /** Inserts the periods not already stored (same name, overlapping dates); returns the inserted ones. */
  addMissing(periods: readonly HistoricalVacation[]): Promise<HistoricalVacation[]>;
}
