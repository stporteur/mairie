import { buildYearCalendar } from '@/domain/calendar/buildYearCalendar';
import { getSchoolHoursByWeekday } from '@/domain/calendar/schoolHours';
import { allocateLeave } from '@/domain/leave/allocateLeave';
import type { LeaveRule } from '@/domain/leave/LeaveRule';
import { getPentecostMonday } from '@/domain/dates/easter';
import { allocateTraining } from '@/domain/training/allocateTraining';
import type { HolidayProvider } from '@/ports/HolidayProvider';

const noHolidays: HolidayProvider = { getHolidays: () => new Set<string>() };

const vacations2026 = [
  { name: 'Vacances d’hiver', start: '2026-02-21', end: '2026-03-09' },
  { name: 'Vacances de printemps', start: '2026-04-11', end: '2026-04-27' },
  { name: 'Grandes vacances', start: '2026-07-04', end: '2026-08-31' },
  { name: 'Vacances de la Toussaint', start: '2026-10-17', end: '2026-11-02' },
  { name: 'Vacances de Noël', start: '2026-12-19', end: '2026-12-31' },
];

function calendar2026(schoolWorkdaysPerWeek = 4) {
  return buildYearCalendar({
    year: 2026,
    vacations: vacations2026,
    vacationWeeklyHours: 35,
    schoolWeeklyHours: 37,
    schoolWorkdaysPerWeek,
  }, noHolidays);
}

describe('getSchoolHoursByWeekday', () => {
  it('spreads quarter hours on Tuesday and Thursday first for a four-day week', () => {
    const hours = getSchoolHoursByWeekday(37.5, 4);
    expect(hours.get(2)).toBe(9.5);
    expect(hours.get(4)).toBe(9.5);
    expect(hours.get(1)).toBe(9.25);
    expect(hours.get(5)).toBe(9.25);
    expect(hours.has(3)).toBe(false);
  });

  it('uses five days for a five-day week', () => {
    const hours = getSchoolHoursByWeekday(37.5, 5);
    expect([...hours.values()]).toEqual([7.5, 7.5, 7.5, 7.5, 7.5]);
  });
});

describe('buildYearCalendar', () => {
  it('covers the whole year', () => {
    expect(calendar2026()).toHaveLength(365);
  });

  it('rests on Wednesdays outside vacations in a four-day week only', () => {
    const wednesday = (days: ReturnType<typeof calendar2026>) => days.find((d) => d.date === '2026-01-14')!;
    expect(wednesday(calendar2026(4)).isWednesdayRest).toBe(true);
    expect(wednesday(calendar2026(5)).isWednesdayRest).toBe(false);
  });

  it('uses the injected holiday provider', () => {
    const days = buildYearCalendar({
      year: 2026,
      vacations: [],
      vacationWeeklyHours: 35,
      schoolWeeklyHours: 37,
      schoolWorkdaysPerWeek: 4,
    }, { getHolidays: () => new Set(['2026-05-01']) });
    const mayDay = days.find((d) => d.date === '2026-05-01')!;
    expect(mayDay.isHoliday).toBe(true);
    expect(mayDay.defaultHours).toBe(0);
  });

  it('gives vacation days one fifth of the weekly vacation hours', () => {
    const day = calendar2026().find((d) => d.date === '2026-07-06')!;
    expect(day.inVacation).toBe(true);
    expect(day.defaultHours).toBe(7);
  });
});

describe('allocateLeave', () => {
  it('allocates exactly the requested quotas', () => {
    const result = allocateLeave(calendar2026(), vacations2026, 25, 9);
    expect(result.cpDates.size).toBe(25);
    expect(result.rttDates.size).toBe(9);
  });

  it('makes the Pentecost Monday an RTT day', () => {
    const result = allocateLeave(calendar2026(), vacations2026, 25, 9);
    expect(result.rttDates.has(getPentecostMonday(2026))).toBe(true);
  });

  it('never takes CP in January', () => {
    const result = allocateLeave(calendar2026(), vacations2026, 25, 9);
    expect([...result.cpDates].some((date) => date.startsWith('2026-01'))).toBe(false);
  });

  it('puts at most five CP days per short vacation before the summer', () => {
    const result = allocateLeave(calendar2026(), vacations2026, 10, 0);
    const winterCp = [...result.cpDates].filter((date) => date >= '2026-02-21' && date <= '2026-03-09');
    expect(winterCp).toHaveLength(5);
  });

  it('zeroes the effective hours of leave days', () => {
    const result = allocateLeave(calendar2026(), vacations2026, 25, 9);
    result.calendar
      .filter((day) => day.isCp || day.isRtt)
      .forEach((day) => expect(day.effectiveHours).toBe(0));
  });

  it('falls back to default quotas for invalid values', () => {
    const result = allocateLeave(calendar2026(), vacations2026, Number.NaN, Number.NaN);
    expect(result.cpDates.size).toBe(25);
    expect(result.rttDates.size).toBe(9);
  });

  it('runs custom rules in order', () => {
    const calls: string[] = [];
    const rules: LeaveRule[] = [
      { apply: () => { calls.push('first'); } },
      { apply: (context) => { calls.push('second'); context.cpDates.add('2026-07-06'); } },
    ];
    const result = allocateLeave(calendar2026(), vacations2026, 25, 9, rules);
    expect(calls).toEqual(['first', 'second']);
    expect([...result.cpDates]).toEqual(['2026-07-06']);
  });
});

describe('allocateTraining', () => {
  it('spreads monthly training hours over free workdays and absorbs rounding', () => {
    const allocated = allocateLeave(calendar2026(), vacations2026, 25, 9).calendar;
    const training = Array.from({ length: 12 }, () => 0);
    training[8] = 10;
    const result = allocateTraining(allocated, training);
    const total = result.filter((d) => d.month === 8).reduce((sum, d) => sum + d.trainingHours, 0);
    expect(Number(total.toFixed(2))).toBe(10);
    expect(result.filter((d) => d.month !== 8).every((d) => d.trainingHours === 0)).toBe(true);
  });
});
