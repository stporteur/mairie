import { EntitySchema } from '@mikro-orm/core';
import type { ParameterStandard } from '../../../domain/parameters/types';
import { DecimalNumberType } from './DecimalNumberType';
import { ParameterSchema } from './ParameterSchema';

export const ParameterStandardSchema = new EntitySchema<ParameterStandard, any>({
  name: 'ParameterStandard',
  tableName: 'parameters_standard',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    parameter: {
      kind: 'm:1',
      entity: () => ParameterSchema,
      fieldName: 'parameter_id',
      nullable: true,
      deleteRule: 'cascade',
    },
    weekHours: { type: DecimalNumberType, fieldName: 'week_hours', nullable: true },
  },
});
