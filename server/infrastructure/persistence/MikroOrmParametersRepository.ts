import type { EntityManager } from '@mikro-orm/core';
import type { ParameterInput, ParameterProfile } from '../../../shared/types/parameters';
import { buildParameterProfiles } from '../../domain/parameters/buildParameterProfiles';
import type { Parameter } from '../../domain/parameters/types';
import type { ParametersRepository } from '../../ports/ParametersRepository';
import { ParameterAtsemSchema } from './entities/ParameterAtsemSchema';
import { ParameterSchema } from './entities/ParameterSchema';
import { ParameterStandardSchema } from './entities/ParameterStandardSchema';
import { PlanningTypeSchema } from './entities/PlanningTypeSchema';

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

  async findById(id: number): Promise<ParameterProfile | null> {
    return this.read(this.orm.em.fork(), id);
  }

  async create(input: ParameterInput): Promise<ParameterProfile> {
    const em = this.orm.em.fork();
    const parameter = em.create(ParameterSchema, { name: input.name.trim() } as never) as unknown as Parameter;
    await this.apply(em, parameter, input, true);
    await em.flush();
    return (await this.read(this.orm.em.fork(), parameter.id)) as ParameterProfile;
  }

  async update(id: number, input: ParameterInput): Promise<ParameterProfile | null> {
    const em = this.orm.em.fork();
    const parameter = await em.findOne(ParameterSchema, { id });
    if (!parameter) return null;
    await this.apply(em, parameter, input, false);
    await em.flush();
    return this.read(this.orm.em.fork(), id);
  }

  async delete(id: number): Promise<boolean> {
    // Rows of parameters_atsem / parameters_standard go away through ON DELETE CASCADE.
    const deleted = await this.orm.em.fork().nativeDelete(ParameterSchema, { id });
    return deleted > 0;
  }

  private async read(em: EntityManager, id: number): Promise<ParameterProfile | null> {
    const parameter = await em.findOne(ParameterSchema, { id }, { populate: ['planningType'] as never });
    if (!parameter) return null;
    const [atsem, standard] = await Promise.all([
      em.findOne(ParameterAtsemSchema, { parameter: id } as never, { populate: ['parameter'] as never }),
      em.findOne(ParameterStandardSchema, { parameter: id } as never, { populate: ['parameter'] as never }),
    ]);
    return buildParameterProfiles([parameter], atsem ? [atsem] : [], standard ? [standard] : [])[0];
  }

  private async apply(em: EntityManager, parameter: Parameter, input: ParameterInput, isNew: boolean): Promise<void> {
    const planningType = await em.findOneOrFail(PlanningTypeSchema, { id: input.planningTypeId as number });
    parameter.name = input.name.trim();
    parameter.holidays = input.holidays;
    parameter.rtt = input.rtt;
    parameter.planningType = planningType;

    // Only the table matching the planning type keeps a row; a type change drops the other one.
    const [atsemRow, standardRow] = isNew ? [null, null] : await Promise.all([
      em.findOne(ParameterAtsemSchema, { parameter: parameter.id } as never),
      em.findOne(ParameterStandardSchema, { parameter: parameter.id } as never),
    ]);

    if (planningType.code === 'ATSEM' && input.atsem) {
      if (atsemRow) Object.assign(atsemRow, input.atsem);
      else em.create(ParameterAtsemSchema, { parameter, ...input.atsem } as never);
    } else if (atsemRow) {
      em.remove(atsemRow);
    }

    if (planningType.code === 'STANDARD' && input.standard) {
      if (standardRow) Object.assign(standardRow, input.standard);
      else em.create(ParameterStandardSchema, { parameter, ...input.standard } as never);
    } else if (standardRow) {
      em.remove(standardRow);
    }
  }
}
