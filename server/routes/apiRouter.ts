import { Router } from 'express';
import type { ExportCalendarRequest } from '../../shared/types/export';
import type { ForecastExportRequest } from '../../shared/types/forecast';
import { generateCalendarWorkbook } from '../export/calendar/generateCalendarWorkbook';
import { generateForecastWorkbook } from '../export/forecast/generateForecastWorkbook';
import { createWorkbookHandler } from '../handlers/createWorkbookHandler';
import { createGetVacations } from '../handlers/getVacations';
import { getStatus } from '../handlers/getStatus';
import type { OfficialVacationsSource } from '../ports/OfficialVacationsSource';

export function createApiRouter(officialVacations: OfficialVacationsSource): Router {
  const router = Router();

  router.get('/status', getStatus);
  router.post('/export', createWorkbookHandler<ExportCalendarRequest>(
    generateCalendarWorkbook,
    'Erreur pendant la génération du fichier Excel.',
  ));
  router.post('/export/forecast', createWorkbookHandler<ForecastExportRequest>(
    generateForecastWorkbook,
    'Erreur pendant la génération du prévisionnel Excel.',
  ));
  router.get('/vacations/:year', createGetVacations(officialVacations));

  return router;
}
