import getJoursFeries from 'jours-feries-fr';
import type { HolidayProvider } from '@/ports/HolidayProvider';

export class JoursFeriesHolidayProvider implements HolidayProvider {
  getHolidays(year: number): ReadonlySet<string> {
    const holidays = getJoursFeries(year, 'YYYY-MM-DD');
    return holidays instanceof Set ? holidays : new Set(holidays);
  }
}
