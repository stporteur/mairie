import type { ExportGateway } from '@/ports/ExportGateway';
import type { FileDownloader } from '@/ports/FileDownloader';
import type { HolidayProvider } from '@/ports/HolidayProvider';
import type { LeavePreferencesStore } from '@/ports/LeavePreferencesStore';
import type { ParametersGateway } from '@/ports/ParametersGateway';
import type { PlanningTypesGateway } from '@/ports/PlanningTypesGateway';
import type { VacationsGateway } from '@/ports/VacationsGateway';

/** Everything the application layer needs from the outside world. */
export interface AppServices {
  holidays: HolidayProvider;
  vacations: VacationsGateway;
  parameters: ParametersGateway;
  planningTypes: PlanningTypesGateway;
  exports: ExportGateway;
  downloader: FileDownloader;
  preferences: LeavePreferencesStore;
}
