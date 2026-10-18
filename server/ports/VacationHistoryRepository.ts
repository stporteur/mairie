import type { HistoricalVacation } from '../../shared/vacations';

export interface VacationHistoryRepository {
  /** Every past holiday period, oldest first. */
  findAll(): Promise<HistoricalVacation[]>;
}
