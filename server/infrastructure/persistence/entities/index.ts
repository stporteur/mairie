import type { EntitySchema } from '@mikro-orm/core';
import { HolidayHistorySchema } from './HolidayHistorySchema';
import { ParameterAtsemSchema } from './ParameterAtsemSchema';
import { ParameterSchema } from './ParameterSchema';
import { ParameterStandardSchema } from './ParameterStandardSchema';
import { PlanningTypeSchema } from './PlanningTypeSchema';

/** Register every EntitySchema here, one file per entity next to this one. */
export const entities: EntitySchema<any>[] = [
  PlanningTypeSchema,
  ParameterSchema,
  ParameterAtsemSchema,
  ParameterStandardSchema,
  HolidayHistorySchema,
];
