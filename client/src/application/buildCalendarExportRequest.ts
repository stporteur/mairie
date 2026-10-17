import type { ExportCalendarRequest } from '@shared/types/export';
import type { TrainingCalendarDay } from '@/domain/calendar/types';

export function buildCalendarExportRequest(
  year: number,
  profileLabel: string,
  calendar: TrainingCalendarDay[],
): ExportCalendarRequest {
  return {
    year,
    profile: profileLabel,
    days: calendar.map((day) => ({
      date: day.date,
      effectiveHours: day.effectiveHours,
      isWeekend: day.isWeekend,
      isHoliday: day.isHoliday,
      inVacation: day.inVacation,
      vacationEstimated: day.vacationEstimated,
      isWednesdayRest: day.isWednesdayRest,
      isCp: day.isCp,
      isRtt: day.isRtt,
    })),
  };
}
