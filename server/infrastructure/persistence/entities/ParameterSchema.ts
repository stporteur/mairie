import { EntitySchema } from '@mikro-orm/core';
import type { Parameter } from '../../../domain/parameters/types';
import { PlanningTypeSchema } from './PlanningTypeSchema';

export const ParameterSchema = new EntitySchema<Parameter, any>({
  name: 'Parameter',
  tableName: 'parameters',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    name: { type: 'string', length: 128 },
    holidays: { type: 'number', nullable: true },
    rtt: { type: 'number', nullable: true },
    planningType: {
      kind: 'm:1',
      entity: () => PlanningTypeSchema,
      fieldName: 'planning_type_id',
      nullable: true,
      deleteRule: 'cascade',
    },
  },
});
