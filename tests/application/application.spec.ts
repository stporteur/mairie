import type { VacationsResponse } from '@shared/types/vacations';
import { computeForecast } from '@/application/computeForecast';
import { buildCalendarExportRequest } from '@/application/buildCalendarExportRequest';
import { computeYearPlan } from '@/application/computeYearPlan';
import { getAnnualWarnings, summarizeYear } from '@/domain/summary/annualSummary';
import { summarizeMonths } from '@/domain/summary/monthlySummary';
import { toLeaveParameters } from '@/domain/settings/normalize';
import type { LeaveSettings } from '@/domain/settings/types';

const holidays = { getHolidays: () => new Set<string>() };
const settings: LeaveSettings = { cpDays: '25', rttDays: '9', schoolWeeklyHours: '37', vacationWeeklyHours: '35' };
const parameters = toLeaveParameters(settings, 4);

function response(year: number): VacationsResponse {
  return {
    year,
    zone: 'C',
    source: { estimated: true },
    vacations: [
      { name: 'Vacances de printemps', start: `${year}-04-11`, end: `${year}-04-27` },
      { name: 'Grandes vacances', start: `${year}-07-04`, end: `${year}-08-31` },
    ],
  };
}

describe('computeForecast', () => {
  it('computes ten consecutive years and reports progress', async () => {
    const fetchVacations = jest.fn(async (year: number) => response(year));
    const onProgress = jest.fn();

    const rows = await computeForecast({ startYear: 2026, parameters, onProgress }, { vacations: { fetchVacations }, holidays });

    expect(rows.map((row) => row.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035]);
    expect(fetchVacations).toHaveBeenCalledTimes(10);
    expect(onProgress).toHaveBeenNthCalledWith(1, 2026, 1, 10);
    expect(onProgress).toHaveBeenLastCalledWith(2035, 10, 10);
    rows.forEach((row) => {
      expect(row.totalLeave).toBe(row.cpDays + row.rttDays);
      expect(row.hoursDue).toBeCloseTo(1607 - row.workHours, 2);
    });
  });

  it('propagates gateway failures', async () => {
    const fetchVacations = jest.fn().mockRejectedValue(new Error('hors ligne'));
    await expect(computeForecast({ startYear: 2026, parameters }, { vacations: { fetchVacations }, holidays }))
      .rejects.toThrow('hors ligne');
  });
});

describe('computeYearPlan and summaries', () => {
  const training = Array.from({ length: 12 }, () => 0);

  it('returns null without vacations', () => {
    expect(computeYearPlan(2026, [], parameters, training, holidays)).toBeNull();
  });

  it('summarizes the year and the months consistently', () => {
    const plan = computeYearPlan(2026, response(2026).vacations, parameters, training, holidays)!;
    const summary = summarizeYear(plan, training);
    const months = summarizeMonths(plan);

    expect(summary.totalLeave).toBe(summary.cpCount + summary.rttCount);
    expect(months).toHaveLength(12);
    expect(months.reduce((sum, month) => sum + month.cpDays, 0)).toBe(summary.cpCount);
    expect(Number(months.reduce((sum, month) => sum + month.workHours, 0).toFixed(2)))
      .toBeCloseTo(summary.totalWorkHours, 1);
  });

  it('warns when leave differs from the expected total or hours exceed the limit', () => {
    const plan = computeYearPlan(2026, response(2026).vacations, parameters, training, holidays)!;
    const summary = summarizeYear(plan, training);
    expect(getAnnualWarnings(summary, summary.totalLeave).leaveMismatch).toBe(false);
    expect(getAnnualWarnings(summary, summary.totalLeave + 1).leaveMismatch).toBe(true);
    expect(getAnnualWarnings({ ...summary, totalHours: 1608 }, summary.totalLeave).hoursExceeded).toBe(true);
  });

  it('builds the export request from the calendar', () => {
    const plan = computeYearPlan(2026, response(2026).vacations, parameters, training, holidays)!;
    const request = buildCalendarExportRequest(2026, '36h30 ATSEM', plan);
    expect(request).toMatchObject({ year: 2026, profile: '36h30 ATSEM' });
    expect(request.days).toHaveLength(365);
    expect(Object.keys(request.days[0]).sort()).toEqual([
      'date', 'effectiveHours', 'inVacation', 'isCp', 'isHoliday', 'isRtt', 'isWednesdayRest', 'isWeekend', 'vacationEstimated',
    ]);
  });
});
