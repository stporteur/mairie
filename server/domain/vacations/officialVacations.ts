import type { VacationPeriod, VacationSource } from '../../../shared/types/vacations';

export type OfficialYearEntry = { C?: VacationPeriod[] } | VacationPeriod[];

export interface OfficialVacationsData {
  years?: Record<string, OfficialYearEntry>;
  source?: VacationSource;
}
