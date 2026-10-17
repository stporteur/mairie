import type { PlanningTypeOption } from '../../shared/types/parameters';

export interface PlanningTypesRepository {
  findAll(): Promise<PlanningTypeOption[]>;
}
