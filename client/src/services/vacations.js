import { formatIso, parseIso } from '../utils/date';
import getJoursFeries from 'jours-feries-fr';

// Build vacation periods from ranges
export function buildVacationsFromRanges(ranges) {
  const periodDefinitions = [
    { name: 'Noël début d\'année', start: ranges.noelDebutStart, end: ranges.noelDebutEnd },
    { name: 'Vacances d\'hiver', start: ranges.hiverStart, end: ranges.hiverEnd },
    { name: 'Vacances de printemps', start: ranges.printempsStart, end: ranges.printempsEnd },
    { name: 'Grandes vacances', start: ranges.eteStart, end: ranges.eteEnd },
    { name: 'Toussaint', start: ranges.toussaintStart, end: ranges.toussaintEnd },
    { name: 'Noël fin d\'année', start: ranges.noelFinStart, end: ranges.noelFinEnd },
  ];

  return periodDefinitions.map((item) => {
    if (!item.start || !item.end) {
      throw new Error(`La période ${item.name} doit avoir des dates de début et de fin.`);
    }
    const start = formatIso(parseIso(item.start));
    const end = formatIso(parseIso(item.end));
    if (start > end) {
      throw new Error(`La date de début doit précéder la date de fin pour ${item.name}.`);
    }
    return {
      name: item.name,
      start,
      end,
    };
  });
}

// Create a set of holidays for a given year
export function createHolidaySet(year) {
  const holidays = getJoursFeries(year, 'YYYY-MM-DD');
  return holidays instanceof Set ? holidays : new Set(holidays);
}

// Find vacation periods matching specific keywords
export function findVacationPeriods(vacations, keywords) {
  return vacations.filter((vacation) =>
    keywords.some((keyword) => vacation.name.toLowerCase().includes(keyword)),
  );
}