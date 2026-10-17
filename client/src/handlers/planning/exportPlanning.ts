import { buildCalendarExportRequest } from '@/application/buildCalendarExportRequest';
import type { AppServices } from '@/application/AppServices';
import type { TrainingCalendarDay } from '@/domain/calendar/types';
import { planningFilename } from '@/domain/export/filenames';
import { getProfileLabel } from '@/domain/settings/leaveProfiles';
import type { LeaveProfiles, SelectedLeaveProfile } from '@/domain/settings/types';
import type { StateSetter } from '../types';

export interface ExportPlanningDeps {
  year: number;
  profiles: LeaveProfiles;
  profile: SelectedLeaveProfile;
  calendar: TrainingCalendarDay[];
  exporting: boolean;
  setExporting: StateSetter<boolean>;
  setError: StateSetter<string>;
  services: Pick<AppServices, 'exports' | 'downloader'>;
}

export function createExportPlanning(deps: ExportPlanningDeps) {
  return async (): Promise<void> => {
    if (!deps.calendar.length || deps.exporting) return;
    deps.setExporting(true);
    deps.setError('');
    try {
      const label = getProfileLabel(deps.profiles, deps.profile);
      const file = await deps.services.exports.exportCalendar(
        buildCalendarExportRequest(deps.year, label, deps.calendar),
      );
      deps.services.downloader.download(file, planningFilename(deps.year, label));
    } catch (failure) {
      deps.setError(failure instanceof Error ? failure.message : 'Erreur pendant la création du fichier Excel.');
    } finally {
      deps.setExporting(false);
    }
  };
}
