import type { ExportCalendarRequest } from '@shared/types/export';
import type { TrainingCalendarDay } from '@/domain/calendar/types';
import type { LeaveSettings } from '@/domain/settings/types';

export function buildCalendarExportRequest(
  year: number,
  profileLabel: string,
  calendar: TrainingCalendarDay[],
  settings?: LeaveSettings,
): ExportCalendarRequest {
  return {
    year,
    profile: profileLabel,
    ...(settings ? {
      profileDetails: `${settings.rttDays} jours RTT · ${settings.vacationWeeklyHours} h vacances · ${settings.schoolWeeklyHours} h scolaire`,
    } : {}),
    days: calendar.map((day) => ({
      date: day.date,
      effectiveHours: day.effectiveHours,
      isWeekend: day.isWeekend,
      isHoliday: day.isHoliday,
      inVacation: day.inVacation,
      vacationEstimated: day.vacationEstimated,
      isRestDay: day.isRestDay,
      isCp: day.isCp,
      isRtt: day.isRtt,
    })),
  };
}
