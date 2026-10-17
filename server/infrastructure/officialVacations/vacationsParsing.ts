import type { VacationPeriod } from '../../../shared/types/vacations';
import type { OfficialYearEntry } from '../../domain/vacations';

export type OfficialYears = Record<string, OfficialYearEntry>;

interface DayEntry {
  date: string;
  zoneC: boolean;
  name: string;
}

/** Extracts a `{ year: periods }` map from the JSON shapes published on data.gouv.fr. */
export function normalizeYearsFromJson(value: unknown): OfficialYears | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (record.years) return record.years as OfficialYears;

  const years: OfficialYears = {};
  let foundYear = false;
  Object.keys(record).forEach((key) => {
    if (/^\d{4}$/.test(key)) {
      foundYear = true;
      years[key] = record[key] as OfficialYearEntry;
    }
  });
  return foundYear ? years : null;
}

function groupDaysByYear(lines: string[], header: string[]): Record<string, DayEntry[]> | null {
  const indexDate = header.indexOf('date');
  const indexZoneC = header.indexOf('vacances_zone_c');
  const indexName = header.indexOf('nom_vacances');
  if (indexDate === -1 || indexZoneC === -1) return null;

  const daysByYear: Record<string, DayEntry[]> = {};
  for (const line of lines) {
    const columns = line.split(',');
    const date = columns[indexDate];
    if (!date) continue;
    const zoneC = (columns[indexZoneC] || '').trim().toLowerCase() === 'true';
    const name = indexName !== -1 ? (columns[indexName] || '').trim() : '';
    const year = date.slice(0, 4);
    (daysByYear[year] ||= []).push({ date, zoneC, name });
  }
  return daysByYear;
}

function toContiguousPeriods(days: DayEntry[]): VacationPeriod[] {
  const periods: VacationPeriod[] = [];
  let current: VacationPeriod | null = null;

  [...days].sort((a, b) => a.date.localeCompare(b.date)).forEach((day) => {
    if (day.zoneC) {
      if (current) {
        current.end = day.date;
      } else {
        current = { name: day.name || 'Vacances', start: day.date, end: day.date };
      }
    } else if (current) {
      periods.push(current);
      current = null;
    }
  });
  if (current) periods.push(current);

  return periods;
}

/** Parses the per-day "vacances scolaires par zones" CSV into zone C periods per year. */
export function parseVacationsCsv(text: string): OfficialYears | null {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(',').map((column) => column.trim());
  if (!header) return null;

  const daysByYear = groupDaysByYear(lines, header);
  if (!daysByYear) return null;

  const result: OfficialYears = {};
  Object.keys(daysByYear).forEach((year) => {
    const periods = toContiguousPeriods(daysByYear[year]);
    if (periods.length) result[year] = periods;
  });
  return result;
}
