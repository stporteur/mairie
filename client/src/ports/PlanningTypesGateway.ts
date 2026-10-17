import type { PlanningTypeOption } from '@shared/types/parameters';

export interface PlanningTypesGateway {
  fetchPlanningTypes(): Promise<PlanningTypeOption[]>;
}
