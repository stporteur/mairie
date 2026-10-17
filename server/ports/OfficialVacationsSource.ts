import type { OfficialVacationsData } from '../domain/vacations';

export interface OfficialVacationsSource {
  getOfficialVacations(): Promise<OfficialVacationsData | null>;
}
