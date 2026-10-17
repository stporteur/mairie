import type { EntityManager } from '@mikro-orm/core';
import type { ParameterProfile } from '../../../shared/types/parameters';
import { buildParameterProfiles } from '../../domain/parameters/buildParameterProfiles';
import type { ParametersRepository } from '../../ports/ParametersRepository';
import { ParameterAtsemSchema } from './entities/ParameterAtsemSchema';
import { ParameterSchema } from './entities/ParameterSchema';
import { ParameterStandardSchema } from './entities/ParameterStandardSchema';

/** The only thing the repository needs from the ORM instance. */
export interface EntityManagerSource {
  em: { fork(): EntityManager };
}

export class MikroOrmParametersRepository implements ParametersRepository {
  constructor(private readonly orm: EntityManagerSource) {}

  async findAll(): Promise<ParameterProfile[]> {
    // A forked manager per call keeps requests isolated from each other.
    const em = this.orm.em.fork();
    const [parameters, atsemRows, standardRows] = await Promise.all([
      em.find(ParameterSchema, {}, { populate: ['planningType'] as never, orderBy: { id: 'asc' } }),
      em.find(ParameterAtsemSchema, {}, { populate: ['parameter'] as never }),
      em.find(ParameterStandardSchema, {}, { populate: ['parameter'] as never }),
    ]);
    return buildParameterProfiles(parameters, atsemRows, standardRows);
  }
}
