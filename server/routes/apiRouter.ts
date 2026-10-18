import { Router } from 'express';
import type { ExportCalendarRequest } from '../../shared/types/export';
import type { ForecastComparisonExportRequest, ForecastExportRequest } from '../../shared/types/forecast';
import { generateCalendarWorkbook } from '../export/calendar/generateCalendarWorkbook';
import { generateCalendarPdf } from '../export/calendar/generateCalendarPdf';
import { generateForecastComparisonPdf } from '../export/forecast/generateForecastComparisonPdf';
import { generateForecastPdf } from '../export/forecast/generateForecastPdf';
import { generateForecastComparisonWorkbook } from '../export/forecast/generateForecastComparisonWorkbook';
import { generateForecastWorkbook } from '../export/forecast/generateForecastWorkbook';
import { createWorkbookHandler } from '../handlers/createWorkbookHandler';
import { createDeleteParameter } from '../handlers/deleteParameter';
import { createGetParameter } from '../handlers/getParameter';
import { createGetParameters } from '../handlers/getParameters';
import { createGetPlanningTypes } from '../handlers/getPlanningTypes';
import { createGetVacations } from '../handlers/getVacations';
import { getStatus } from '../handlers/getStatus';
import { createCreateParameter, createUpdateParameter } from '../handlers/saveParameter';
import type { OfficialVacationsSource } from '../ports/OfficialVacationsSource';
import type { ParametersRepository } from '../ports/ParametersRepository';
import type { PlanningTypesRepository } from '../ports/PlanningTypesRepository';
import type { VacationHistoryRepository } from '../ports/VacationHistoryRepository';

export interface ApiDependencies {
  officialVacations: OfficialVacationsSource;
  vacationHistory: VacationHistoryRepository;
  parameters: ParametersRepository;
  planningTypes: PlanningTypesRepository;
}

export function createApiRouter({ officialVacations, vacationHistory, parameters, planningTypes }: ApiDependencies): Router {
  const router = Router();

  router.get('/status', getStatus);
  router.post('/export', createWorkbookHandler<ExportCalendarRequest>(
    generateCalendarWorkbook,
    'Erreur pendant la génération du fichier Excel.',
  ));
  router.post('/export/pdf', createWorkbookHandler<ExportCalendarRequest>(
    generateCalendarPdf,
    'Erreur pendant la génération du fichier PDF.',
  ));
  router.post('/export/forecast/pdf', createWorkbookHandler<ForecastExportRequest>(
    generateForecastPdf,
    'Erreur pendant la génération du prévisionnel PDF.',
  ));
  router.post('/export/forecast-comparison/pdf', createWorkbookHandler<ForecastComparisonExportRequest>(
    generateForecastComparisonPdf,
    'Erreur pendant la génération du comparatif PDF.',
  ));
  router.post('/export/forecast', createWorkbookHandler<ForecastExportRequest>(
    generateForecastWorkbook,
    'Erreur pendant la génération du prévisionnel Excel.',
  ));
  router.post('/export/forecast-comparison', createWorkbookHandler<ForecastComparisonExportRequest>(
    generateForecastComparisonWorkbook,
    'Erreur pendant la génération du comparatif Excel.',
  ));
  router.get('/vacations/:year', createGetVacations({ officialVacations, history: vacationHistory }));
  router.get('/parameters', createGetParameters(parameters));
  router.post('/parameters', createCreateParameter({ parameters, planningTypes }));
  router.get('/parameters/:id', createGetParameter(parameters));
  router.put('/parameters/:id', createUpdateParameter({ parameters, planningTypes }));
  router.delete('/parameters/:id', createDeleteParameter(parameters));
  router.get('/planning-types', createGetPlanningTypes(planningTypes));

  return router;
}
