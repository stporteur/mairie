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

  async addMissing(periods: readonly HistoricalVacation[]): Promise<HistoricalVacation[]> {
    const existing = await this.findAll();
    const missing = periods.filter((period) => !existing.some(
      (stored) => stored.name === period.name && stored.start <= period.end && stored.end >= period.start,
    ));
    if (missing.length === 0) return [];

    const em = this.orm.em.fork();
    missing.forEach(({ name, start, end }) => {
      em.create(HolidayHistorySchema, { name, dateStart: start, dateEnd: end } as never);
    });
    await em.flush();
    return missing;
  }
}
