import { EntitySchema } from '@mikro-orm/core';
import type { ParameterAtsem } from '../../../domain/parameters/types';
import { DecimalNumberType } from './DecimalNumberType';
import { ParameterSchema } from './ParameterSchema';

export const ParameterAtsemSchema = new EntitySchema<ParameterAtsem, any>({
  name: 'ParameterAtsem',
  tableName: 'parameters_atsem',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    parameter: {
      kind: 'm:1',
      entity: () => ParameterSchema,
      fieldName: 'parameter_id',
      nullable: true,
      deleteRule: 'cascade',
    },
    holidayPeriodOffdays: { type: 'string', fieldName: 'holiday_period_offdays', length: 64, nullable: true },
    holidayPeriodHours: { type: DecimalNumberType, fieldName: 'holiday_period_hours', nullable: true },
    schoolPeriodOffdays: { type: 'string', fieldName: 'school_period_offdays', length: 64, nullable: true },
    schoolPeriodHours: { type: DecimalNumberType, fieldName: 'school_period_hours', nullable: true },
  },
});
