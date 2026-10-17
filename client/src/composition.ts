import type { AppServices } from '@/application/AppServices';
import { HttpExportGateway } from '@/infrastructure/HttpExportGateway';
import { BrowserFileDownloader } from '@/infrastructure/BrowserFileDownloader';
import { HttpParametersGateway } from '@/infrastructure/HttpParametersGateway';
import { HttpVacationsGateway } from '@/infrastructure/HttpVacationsGateway';
import { JoursFeriesHolidayProvider } from '@/infrastructure/JoursFeriesHolidayProvider';
import { LocalStorageLeavePreferences } from '@/infrastructure/LocalStorageLeavePreferences';

/** The only place where concrete implementations are chosen. */
export function createServices(): AppServices {
  return {
    holidays: new JoursFeriesHolidayProvider(),
    vacations: new HttpVacationsGateway(),
    parameters: new HttpParametersGateway(),
    exports: new HttpExportGateway(),
    downloader: new BrowserFileDownloader(),
    preferences: new LocalStorageLeavePreferences(),
  };
}
