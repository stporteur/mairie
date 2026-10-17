import { buildYearCalendar } from '@/domain/calendar/buildYearCalendar';
import { allocateLeave } from '@/domain/leave/allocateLeave';
import type { LeaveRule } from '@/domain/leave/LeaveRule';
import { getPentecostMonday } from '@/domain/dates/easter';
import { createPlanningStrategy } from '@/domain/planning/createPlanningStrategy';
import { distributeQuarterHours } from '@/domain/planning/distributeHours';
import type { PlanningDescriptor } from '@/domain/planning/types';
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

const ATSEM: PlanningDescriptor = { type: 'ATSEM', schoolRestDays: [3], vacationRestDays: [] };
const STANDARD: PlanningDescriptor = { type: 'STANDARD', schoolRestDays: [], vacationRestDays: [] };

function calendar2026(planning: PlanningDescriptor = ATSEM) {
  return buildYearCalendar({
    year: 2026,
    vacations: vacations2026,
    strategy: createPlanningStrategy(planning, { school: 37, vacation: 35 }),
  }, noHolidays);
}

describe('distributeQuarterHours', () => {
  it('spreads quarter hours on Tuesday and Thursday first for a four-day week', () => {
    const hours = distributeQuarterHours(37.5, [1, 2, 4, 5], [2, 4, 1, 5, 3]);
    expect(hours.get(2)).toBe(9.5);
    expect(hours.get(4)).toBe(9.5);
    expect(hours.get(1)).toBe(9.25);
    expect(hours.get(5)).toBe(9.25);
    expect(hours.has(3)).toBe(false);
  });

  it('splits evenly over five days and returns nothing without workdays', () => {
    expect([...distributeQuarterHours(37.5, [1, 2, 3, 4, 5], [2, 4, 1, 5, 3]).values()]).toEqual([7.5, 7.5, 7.5, 7.5, 7.5]);
    expect(distributeQuarterHours(37.5, [], [2]).size).toBe(0);
  });
});

describe('planning strategies', () => {
  it('ATSEM rests on the profile rest days of each period', () => {
    const strategy = createPlanningStrategy(
      { type: 'ATSEM', schoolRestDays: [3], vacationRestDays: [1, 5] },
      { school: 37.5, vacation: 30 },
    );
    expect(strategy.isRestDay(3, false)).toBe(true);
    expect(strategy.isRestDay(3, true)).toBe(false);
    expect(strategy.isRestDay(1, true)).toBe(true);
    expect(strategy.dailyHours(2, false)).toBe(9.5);
    expect(strategy.dailyHours(3, false)).toBe(0);
    expect(strategy.dailyHours(2, true)).toBe(10);
    expect(strategy.dailyHours(1, true)).toBe(0);
  });

  it('ATSEM without rest days works five days a week', () => {
    const strategy = createPlanningStrategy({ type: 'ATSEM', schoolRestDays: [], vacationRestDays: [] }, { school: 35, vacation: 35 });
    expect(strategy.isRestDay(3, false)).toBe(false);
    expect(strategy.dailyHours(3, false)).toBe(7);
  });

  it('STANDARD never rests and splits the hours evenly over five days all year', () => {
    const strategy = createPlanningStrategy(STANDARD, { school: 37.5, vacation: 37.5 });
    expect(strategy.isRestDay(3, false)).toBe(false);
    expect(strategy.dailyHours(3, false)).toBe(7.5);
    expect(strategy.dailyHours(1, true)).toBe(7.5);
  });
});

describe('buildYearCalendar', () => {
  it('covers the whole year', () => {
    expect(calendar2026()).toHaveLength(365);
  });

  it('flags the strategy rest days only', () => {
    const wednesday = (days: ReturnType<typeof calendar2026>) => days.find((d) => d.date === '2026-01-14')!;
    expect(wednesday(calendar2026(ATSEM)).isRestDay).toBe(true);
    expect(wednesday(calendar2026(STANDARD)).isRestDay).toBe(false);
  });

  it('uses the injected holiday provider', () => {
    const days = buildYearCalendar({
      year: 2026,
      vacations: [],
      strategy: createPlanningStrategy(ATSEM, { school: 37, vacation: 35 }),
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
