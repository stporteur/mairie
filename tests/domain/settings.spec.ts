import { loadLeaveState } from '@/application/loadLeaveState';
import { forecastFilename, planningFilename } from '@/domain/export/filenames';
import { applyProfileToSettings, findMatchingProfile, getProfileLabel } from '@/domain/settings/leaveProfiles';
import {
  normalizeLeaveSettings,
  normalizeQuota,
  normalizeSettingValue,
  normalizeWeeklyHours,
  toLeaveParameters,
} from '@/domain/settings/normalize';
import { validateForecastSettings, validatePlanningSettings } from '@/domain/settings/validate';
import type { LeaveSettings } from '@/domain/settings/types';
import { adjustVacationDates } from '@/domain/vacations/adjustVacationDates';
import { prepareVacations } from '@/domain/vacations/prepareVacations';
import type { LeavePreferencesStore } from '@/ports/LeavePreferencesStore';

const atsem365: LeaveSettings = { cpDays: '25', rttDays: '9', schoolWeeklyHours: '37', vacationWeeklyHours: '35' };

function fakeStore(values: Partial<{ settings: unknown; profile: string; applied: string }> = {}): LeavePreferencesStore {
  return {
    readSettings: () => values.settings ?? null,
    readProfile: () => values.profile ?? null,
    readAppliedProfile: () => values.applied ?? null,
    writeSettings: jest.fn(),
    writeProfile: jest.fn(),
    writeAppliedProfile: jest.fn(),
  };
}

describe('normalization', () => {
  it('treats empty fields as zero and invalid ones as the fallback', () => {
    expect(normalizeQuota('', 25)).toBe(0);
    expect(normalizeQuota('3.5', 25)).toBe(25);
    expect(normalizeQuota('-1', 25)).toBe(25);
    expect(normalizeWeeklyHours('', 35)).toBe(0);
    expect(normalizeWeeklyHours('abc', 35)).toBe(35);
    expect(normalizeWeeklyHours('37.5', 35)).toBe(37.5);
  });

  it('normalizes a whole form and a single field', () => {
    expect(normalizeLeaveSettings({ ...atsem365, cpDays: 'x', rttDays: '' })).toMatchObject({ cpDays: '25', rttDays: '0' });
    expect(normalizeSettingValue('rttDays', '12')).toBe('12');
  });

  it('derives calculation parameters and the weekly workdays from the profile', () => {
    expect(toLeaveParameters(atsem365, 'mairie375').schoolWorkdaysPerWeek).toBe(5);
    expect(toLeaveParameters(atsem365, 'atsem365')).toMatchObject({ cpQuota: 25, rttQuota: 9, schoolWorkdaysPerWeek: 4 });
  });
});

describe('validation', () => {
  it('rejects school hours that are empty, too high or not quarter hours', () => {
    expect(validatePlanningSettings({ ...atsem365, schoolWeeklyHours: '' })).toMatch(/Scolaire/);
    expect(validatePlanningSettings({ ...atsem365, schoolWeeklyHours: '40' })).not.toBeNull();
    expect(validatePlanningSettings({ ...atsem365, schoolWeeklyHours: '37.1' })).not.toBeNull();
    expect(validatePlanningSettings(atsem365)).toBeNull();
  });

  it('requires RTT and vacation hours for the forecast', () => {
    expect(validateForecastSettings({ ...atsem365, schoolWeeklyHours: '41' })).toMatch(/scolaire/);
    expect(validateForecastSettings({ ...atsem365, rttDays: '' })).toMatch(/Renseignez/);
    expect(validateForecastSettings(atsem365)).toBeNull();
  });
});

describe('profiles', () => {
  it('finds the profile matching the settings, or custom', () => {
    expect(findMatchingProfile(atsem365)).toBe('atsem365');
    expect(findMatchingProfile({ ...atsem365, rttDays: '3' })).toBe('custom');
  });

  it('applies a profile and clears the fields for custom', () => {
    expect(applyProfileToSettings(atsem365, 'atsem375')).toEqual({ cpDays: '25', rttDays: '15', schoolWeeklyHours: '37.5', vacationWeeklyHours: '37.5' });
    expect(applyProfileToSettings(atsem365, 'custom')).toEqual({ cpDays: '25', rttDays: '', schoolWeeklyHours: '', vacationWeeklyHours: '' });
  });

  it('labels profiles', () => {
    expect(getProfileLabel('custom')).toBe('Custom');
    expect(getProfileLabel('mairie375')).toBe('37h30 MAIRIE');
  });
});

describe('loadLeaveState', () => {
  it('defaults to the ATSEM 36h30 profile', () => {
    expect(loadLeaveState(fakeStore())).toEqual({
      selectedProfile: 'atsem365',
      draftSettings: atsem365,
      appliedSettings: atsem365,
      appliedProfile: 'atsem365',
    });
  });

  it('restores saved settings and profiles', () => {
    const state = loadLeaveState(fakeStore({
      settings: { cpDays: 20, rttDays: 15, schoolWeeklyHours: 37.5, vacationWeeklyHours: 37.5 },
      profile: 'custom',
      applied: 'mairie375',
    }));
    expect(state.appliedSettings.cpDays).toBe('20');
    expect(state.selectedProfile).toBe('custom');
    expect(state.draftSettings).toMatchObject({ cpDays: '20', rttDays: '' });
    expect(state.appliedProfile).toBe('mairie375');
  });

  it('reverts invalid saved school hours to the default', () => {
    const state = loadLeaveState(fakeStore({ settings: { schoolWeeklyHours: 99 } }));
    expect(state.appliedSettings.schoolWeeklyHours).toBe('37');
  });
});

describe('export filenames', () => {
  it('matches the names produced by the server', () => {
    expect(planningFilename(2029, '37h30 MAIRIE')).toBe('Planing_2029_37H30_MAIRIE.xlsx');
    expect(forecastFilename(2026, '37h30 MAIRIE')).toBe('Previsionnel_2026_37h30_MAIRIE.xlsx');
  });
});

describe('vacations', () => {
  it('moves official starts back to a Saturday and ends December Christmas on the 31st', () => {
    const [winter, noel] = adjustVacationDates([
      { name: 'Vacances d’hiver', start: '2026-02-23', end: '2026-03-09' },
      { name: 'Vacances de Noël', start: '2026-12-19', end: '2026-12-27' },
    ], 2026);
    expect(winter.start).toBe('2026-02-21');
    expect(noel.end).toBe('2026-12-31');
  });

  it('keeps estimated dates untouched', () => {
    const [period] = adjustVacationDates([{ name: 'Vacances x', start: '2026-02-23', end: '2026-03-09', estimated: true }], 2026);
    expect(period.start).toBe('2026-02-23');
  });

  it('keeps only school vacations and flags estimated sources', () => {
    const prepared = prepareVacations({
      vacations: [
        { name: 'Vacances d’hiver', start: '2026-02-21', end: '2026-03-09' },
        { name: 'Pont de l’Ascension', start: '2026-05-14', end: '2026-05-17' },
      ],
      source: { estimated: true },
    }, 2026);
    expect(prepared).toHaveLength(1);
    expect(prepared[0].estimated).toBe(true);
  });
});
