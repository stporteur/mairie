import type { ExportGateway } from '@/ports/ExportGateway';
import type { FileDownloader } from '@/ports/FileDownloader';
import type { HolidayProvider } from '@/ports/HolidayProvider';
import type { LeavePreferencesStore } from '@/ports/LeavePreferencesStore';
import type { ParametersGateway } from '@/ports/ParametersGateway';
import type { VacationsGateway } from '@/ports/VacationsGateway';

/** Everything the application layer needs from the outside world. */
export interface AppServices {
  holidays: HolidayProvider;
  vacations: VacationsGateway;
  parameters: ParametersGateway;
  exports: ExportGateway;
  downloader: FileDownloader;
  preferences: LeavePreferencesStore;
}
