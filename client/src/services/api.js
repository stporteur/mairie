import { formatIso } from '../utils/date';

// Fetch school vacations from API
export async function fetchSchoolVacations(year) {
  try {
    const response = await fetch(`/api/vacations/${year}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors du chargement des vacances:', error);
    throw error;
  }
}

// Adjust vacation dates: start on Saturday and end on Sunday
export function adjustVacationDates(vacations, year) {
  return vacations.map((vacation) => {
    const startDate = new Date(vacation.start + 'T00:00:00Z');
    const endDate = new Date(vacation.end + 'T00:00:00Z');

    // For December Christmas, always end on December 31st
    const isNoelDecember = /no[eën]l/i.test(vacation.name) && 
                           startDate.getUTCMonth() === 11;

    let adjustedStart = new Date(startDate);
    let adjustedEnd = new Date(endDate);

    if (!isNoelDecember) {
      // Find the Saturday before or equal to the start date
      const dayOfWeekStart = startDate.getUTCDay();
      const daysBackToSaturday =
        dayOfWeekStart === 6 ? 0 : ((dayOfWeekStart + 1) % 7);

      adjustedStart.setUTCDate(
        adjustedStart.getUTCDate() - daysBackToSaturday
      );
    } else {
      // For December Christmas, always end on December 31st
      adjustedEnd.setUTCFullYear(year, 11, 31);
    }

    return {
      name: vacation.name,
      start: formatIso(adjustedStart),
      end: formatIso(adjustedEnd),
    };
  });
}