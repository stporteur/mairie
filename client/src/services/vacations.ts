import getJoursFeries from 'jours-feries-fr';

export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
}

// Create a set of holidays for a given year
export function createHolidaySet(year: number): Set<string> {
  const holidays = getJoursFeries(year, 'YYYY-MM-DD');
  return holidays instanceof Set ? holidays : new Set(holidays);
}

// Find vacation periods matching specific keywords
export function findVacationPeriods(vacations: VacationPeriod[], keywords: readonly string[]): VacationPeriod[] {
  return vacations.filter((vacation) =>
    keywords.some((keyword) => vacation.name.toLowerCase().includes(keyword)),
  );
}