import { EntitySchema } from '@mikro-orm/core';

export interface HolidayHistory {
  id: number;
  name: string;
  dateStart: string;
  dateEnd: string;
}

// `columnType: 'date'` with a string type keeps ISO dates (no timezone conversion).
export const HolidayHistorySchema = new EntitySchema<HolidayHistory, any>({
  name: 'HolidayHistory',
  tableName: 'holidays_history',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    name: { type: 'string', length: 12 },
    dateStart: { type: 'string', columnType: 'date', fieldName: 'date_start' },
    dateEnd: { type: 'string', columnType: 'date', fieldName: 'date_end' },
  },
});
