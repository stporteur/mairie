import type { PlanningTypeOption } from '../../../shared/types/parameters';
import type { PlanningTypesRepository } from '../../ports/PlanningTypesRepository';
import type { EntityManagerSource } from './MikroOrmParametersRepository';
import { PlanningTypeSchema } from './entities/PlanningTypeSchema';

export class MikroOrmPlanningTypesRepository implements PlanningTypesRepository {
  constructor(private readonly orm: EntityManagerSource) {}

  async findAll(): Promise<PlanningTypeOption[]> {
    const types = await this.orm.em.fork().find(PlanningTypeSchema, {}, { orderBy: { id: 'asc' } });
    return types.map(({ id, code, name }) => ({ id, code, name }));
  }
}
