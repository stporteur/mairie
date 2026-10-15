import { formatIso } from '../utils/date';

export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
  estimated?: boolean;
}

export interface VacationSource {
  local?: boolean;
  estimated?: boolean;
  dataset?: string;
  resource?: {
    id?: string;
    title?: string;
    url?: string;
  };
}

export interface ApiResponse {
  year: number;
  zone: string;
  vacations: VacationPeriod[];
  source: VacationSource;
}

// Fetch school vacations from API
export async function fetchSchoolVacations(year: number): Promise<ApiResponse> {
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
export function adjustVacationDates(vacations: VacationPeriod[], year: number): VacationPeriod[] {
  return vacations.map((vacation) => {
    const startDate = new Date(vacation.start + 'T00:00:00Z');
    const endDate = new Date(vacation.end + 'T00:00:00Z');

    // For December Christmas, always end on December 31st
    const isNoelDecember = /no[eën]l/i.test(vacation.name) && startDate.getUTCMonth() === 11;

    let adjustedStart = new Date(startDate);
    let adjustedEnd = new Date(endDate);

    if (!vacation.estimated) {
      // For December Christmas, always end on December 31st
      if (isNoelDecember) {
        adjustedEnd.setUTCFullYear(year, 11, 31);
      } else {
        // Find the Saturday before or equal to the start date
        const dayOfWeekStart = startDate.getUTCDay();
        const daysBackToSaturday = dayOfWeekStart === 6 ? 0 : ((dayOfWeekStart + 1) % 7);

        adjustedStart.setUTCDate(adjustedStart.getUTCDate() - daysBackToSaturday);
      }
    }

    return {
      name: vacation.name,
      start: formatIso(adjustedStart),
      end: formatIso(adjustedEnd),
      estimated: vacation.estimated,
    };
  });
}