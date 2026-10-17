import type { VacationPeriod } from '@shared/types/vacations';

export function findVacationPeriods<T extends Pick<VacationPeriod, 'name'>>(
  vacations: T[],
  keywords: readonly string[],
): T[] {
  return vacations.filter((vacation) =>
    keywords.some((keyword) => vacation.name.toLowerCase().includes(keyword)),
  );
}
