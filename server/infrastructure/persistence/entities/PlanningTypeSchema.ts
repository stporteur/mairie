import { EntitySchema } from '@mikro-orm/core';
import type { PlanningType } from '../../../domain/parameters/types';

export const PlanningTypeSchema = new EntitySchema<PlanningType, any>({
  name: 'PlanningType',
  tableName: 'planning_types',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    code: { type: 'string', length: 32 },
    name: { type: 'string', length: 128 },
  },
});
