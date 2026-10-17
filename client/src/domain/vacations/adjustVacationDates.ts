import type { VacationPeriod } from '@shared/types/vacations';
import { formatIso } from '../dates/iso';

/** Moves non-estimated starts back to a Saturday; December Christmas always ends on 31/12. */
export function adjustVacationDates(vacations: VacationPeriod[], year: number): VacationPeriod[] {
  return vacations.map((vacation) => {
    const startDate = new Date(`${vacation.start}T00:00:00Z`);
    const adjustedStart = new Date(startDate);
    const adjustedEnd = new Date(`${vacation.end}T00:00:00Z`);
    const isNoelDecember = /no[eën]l/i.test(vacation.name) && startDate.getUTCMonth() === 11;

    if (!vacation.estimated) {
      if (isNoelDecember) {
        adjustedEnd.setUTCFullYear(year, 11, 31);
      } else {
        const dayOfWeek = startDate.getUTCDay();
        const daysBackToSaturday = dayOfWeek === 6 ? 0 : ((dayOfWeek + 1) % 7);
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
