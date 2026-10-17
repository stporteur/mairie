import type { PlanningTypeOption } from '@shared/types/parameters';
import type { PlanningTypesGateway } from '@/ports/PlanningTypesGateway';
import { requestJson } from './requestJson';

export class HttpPlanningTypesGateway implements PlanningTypesGateway {
  fetchPlanningTypes(): Promise<PlanningTypeOption[]> {
    return requestJson<PlanningTypeOption[]>('/api/planning-types');
  }
}
