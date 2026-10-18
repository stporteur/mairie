import type { HistoricalVacation } from '../../../shared/vacations';
import type { VacationHistoryRepository } from '../../ports/VacationHistoryRepository';
import type { EntityManagerSource } from './MikroOrmParametersRepository';
import { HolidayHistorySchema } from './entities/HolidayHistorySchema';

export class MikroOrmVacationHistoryRepository implements VacationHistoryRepository {
  constructor(private readonly orm: EntityManagerSource) {}

  async findAll(): Promise<HistoricalVacation[]> {
    const rows = await this.orm.em.fork().find(HolidayHistorySchema, {}, { orderBy: { dateStart: 'asc' } });
    return rows.map(({ name, dateStart, dateEnd }) => ({ name, start: dateStart, end: dateEnd }));
  }
}
