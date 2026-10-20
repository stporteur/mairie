import type { ForecastSummaryRow } from '@shared/types/forecast';
import { createExportForecast } from '@/handlers/forecast/exportForecast';
import { createCalculateForecast } from '@/handlers/forecast/calculateForecast';
import { createToggleSidebar } from '@/handlers/layout/toggleSidebar';
import { createBlurLeaveSetting } from '@/handlers/leaveSettings/blurLeaveSetting';
import { createChangeLeaveProfile } from '@/handlers/leaveSettings/changeLeaveProfile';
import { createChangeLeaveSetting } from '@/handlers/leaveSettings/changeLeaveSetting';
import { createCalculatePlanning } from '@/handlers/planning/calculatePlanning';
import { createChangePlanningSetting } from '@/handlers/planning/changePlanningSetting';
import { createChangeYear } from '@/handlers/planning/changeYear';
import { createEditVacationPeriod } from '@/handlers/planning/editVacationPeriod';
import { createExportPlanning } from '@/handlers/planning/exportPlanning';
import { createLoadVacations } from '@/handlers/vacations/loadVacations';
import type { StateSetter } from '@/handlers/types';
import type { LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import { PROFILES } from '../fixtures/leaveProfiles';

const settings: LeaveSettings = { cpDays: '25', rttDays: '9', schoolWeeklyHours: '37', vacationWeeklyHours: '35' };

/** A state holder usable as a setter, so handlers are tested without React. */
function createState<T>(initial: T) {
  const state = { value: initial };
  const set: StateSetter<T> = (update) => {
    state.value = typeof update === 'function' ? (update as (current: T) => T)(state.value) : update;
  };
  return { state, set };
}

describe('layout handlers', () => {
  it('toggles the sidebar', () => {
    const open = createState(true);
    const toggle = createToggleSidebar({ setOpen: open.set });
    toggle();
    expect(open.state.value).toBe(false);
    toggle();
    expect(open.state.value).toBe(true);
  });
});

describe('leave settings handlers', () => {
  it('switches to custom when a setting other than CP changes', () => {
    const form = createState(settings);
    const profile = createState<SelectedLeaveProfile>('atsem365');
    const change = createChangeLeaveSetting({ setSettings: form.set, setProfile: profile.set });

    change('cpDays', '20');
    expect(profile.state.value).toBe('atsem365');
    change('rttDays', '3');
    expect(profile.state.value).toBe('custom');
    expect(form.state.value).toMatchObject({ cpDays: '20', rttDays: '3' });
  });

  it('applies a profile and clears the error', () => {
    const form = createState(settings);
    const profile = createState<SelectedLeaveProfile>('atsem365');
    const clearError = jest.fn();
    createChangeLeaveProfile({ profiles: PROFILES, setSettings: form.set, setProfile: profile.set, clearError })('atsem375');

    expect(profile.state.value).toBe('atsem375');
    expect(form.state.value.rttDays).toBe('15');
    expect(clearError).toHaveBeenCalled();
  });

  it('normalizes a field on blur except school hours and empty values', () => {
    const form = createState({ ...settings, rttDays: '-4', schoolWeeklyHours: '99' });
    const blur = createBlurLeaveSetting({ settings: form.state.value, setSettings: form.set });

    blur('rttDays');
    blur('schoolWeeklyHours');
    expect(form.state.value.rttDays).toBe('9');
    expect(form.state.value.schoolWeeklyHours).toBe('99');
  });
});

describe('planning handlers', () => {
  it('clears the error when the school hours change', () => {
    const changeLeaveSetting = jest.fn();
    const clearError = jest.fn();
    const change = createChangePlanningSetting({ changeLeaveSetting, clearError });

    change('cpDays', '1');
    expect(clearError).not.toHaveBeenCalled();
    change('schoolWeeklyHours', '37');
    expect(clearError).toHaveBeenCalledTimes(1);
    expect(changeLeaveSetting).toHaveBeenCalledTimes(2);
  });

  it('falls back to 2026 for an invalid year', () => {
    const year = createState(2030);
    const change = createChangeYear({ setYear: year.set });
    change('2028');
    expect(year.state.value).toBe(2028);
    change('');
    expect(year.state.value).toBe(2026);
  });

  it('edits one vacation date without mutating the others', () => {
    const vacations = createState([
      { name: 'A', start: '2026-01-01', end: '2026-01-02' },
      { name: 'B', start: '2026-02-01', end: '2026-02-02' },
    ]);
    createEditVacationPeriod({ setVacations: vacations.set })(1, 'end', '2026-02-10');
    expect(vacations.state.value[1].end).toBe('2026-02-10');
    expect(vacations.state.value[0].end).toBe('2026-01-02');
  });

  it('moves the end to the Sunday two weeks after when a start changes, but not when an end changes', () => {
    const vacations = createState([
      { name: 'Vacances d’hiver', start: '2026-02-14', end: '2026-03-01' },
      { name: 'Grandes vacances', start: '2026-07-04', end: '2026-08-31' },
    ]);
    const edit = createEditVacationPeriod({ setVacations: vacations.set });
    edit(0, 'start', '2026-02-21');
    expect(vacations.state.value[0].end).toBe('2026-03-08');
    edit(1, 'start', '2026-07-11');
    expect(vacations.state.value[1].end).toBe('2026-08-31');
    edit(0, 'end', '2026-03-10');
    expect(vacations.state.value[0]).toMatchObject({ start: '2026-02-21', end: '2026-03-10' });
  });

  it('refuses invalid school hours when calculating', () => {
    const error = createState('');
    const applied = createState(settings);
    createCalculatePlanning({
      settings: { ...settings, schoolWeeklyHours: '' },
      profile: 'atsem365',
      setSettings: jest.fn(),
      setAppliedSettings: applied.set,
      setAppliedProfile: jest.fn(),
      setError: error.set,
    })();
    expect(error.state.value).toMatch(/Scolaire/);
    expect(applied.state.value).toBe(settings);
  });

  it('applies normalized settings when calculating', () => {
    const draft = createState(settings);
    const applied = createState<LeaveSettings>({ ...settings, cpDays: '0' });
    const appliedProfile = createState<SelectedLeaveProfile>('custom');
    const error = createState('boom');
    createCalculatePlanning({
      settings: { ...settings, cpDays: 'abc' },
      profile: 'atsem375',
      setSettings: draft.set,
      setAppliedSettings: applied.set,
      setAppliedProfile: appliedProfile.set,
      setError: error.set,
    })();
    expect(applied.state.value.cpDays).toBe('25');
    expect(draft.state.value.cpDays).toBe('25');
    expect(appliedProfile.state.value).toBe('atsem375');
    expect(error.state.value).toBe('');
  });

  it('exports the planning and downloads it with the expected name', async () => {
    const blob = new Blob(['x']);
    const exportCalendar = jest.fn().mockResolvedValue(blob);
    const download = jest.fn();
    const exporting = createState(false);
    const error = createState('');

    await createExportPlanning({
      year: 2026,
      profiles: PROFILES,
      profile: 'atsem365',
      settings: { cpDays: '25', rttDays: '9', schoolWeeklyHours: '37', vacationWeeklyHours: '35' },
      calendar: [{ date: '2026-01-01' } as never],
      exporting: false,
      setExporting: exporting.set,
      setError: error.set,
      services: { exports: { exportCalendar, exportForecast: jest.fn(), exportForecastComparison: jest.fn() }, downloader: { download } },
    })();

    expect(exportCalendar).toHaveBeenCalledWith(expect.objectContaining({ year: 2026, profile: '36h30 ATSEM' }), 'xlsx');
    expect(download).toHaveBeenCalledWith(blob, 'Planing_2026_36H30_ATSEM.xlsx');
    expect(exporting.state.value).toBe(false);
  });

  it('exports the planning as a PDF with a .pdf name', async () => {
    const blob = new Blob(['x']);
    const exportCalendar = jest.fn().mockResolvedValue(blob);
    const download = jest.fn();

    await createExportPlanning({
      year: 2026,
      profiles: PROFILES,
      profile: 'atsem365',
      settings: { cpDays: '25', rttDays: '9', schoolWeeklyHours: '37', vacationWeeklyHours: '35' },
      calendar: [{ date: '2026-01-01' } as never],
      exporting: false,
      setExporting: jest.fn(),
      setError: jest.fn(),
      services: { exports: { exportCalendar, exportForecast: jest.fn(), exportForecastComparison: jest.fn() }, downloader: { download } },
    }, 'pdf')();

    expect(exportCalendar).toHaveBeenCalledWith(expect.anything(), 'pdf');
    expect(download).toHaveBeenCalledWith(blob, 'Planing_2026_36H30_ATSEM.pdf');
  });

  it('reports export failures', async () => {
    const error = createState('');
    await createExportPlanning({
      year: 2026,
      profiles: PROFILES,
      profile: 'custom',
      settings: { cpDays: '25', rttDays: '9', schoolWeeklyHours: '37',       vacationWeeklyHours: '35' },
            calendar: [{ date: '2026-01-01' } as never],
            exporting: false,
            setExporting: jest.fn(),
      setError: error.set,
      services: {
        exports: { exportCalendar: jest.fn().mockRejectedValue(new Error('Échec')), exportForecast: jest.fn(), exportForecastComparison: jest.fn() },
        downloader: { download: jest.fn() },
      },
    })();
    expect(error.state.value).toBe('Échec');
  });

  it('does not export while already exporting or without data', async () => {
    const exportCalendar = jest.fn();
    const deps = {
      year: 2026,
      profiles: PROFILES,
      profile: 'custom' as const,
      settings: { cpDays: '25', rttDays: '9', schoolWeeklyHours: '37', vacationWeeklyHours: '35' },
      setExporting: jest.fn(),
      setError: jest.fn(),
      services: { exports: { exportCalendar, exportForecast: jest.fn(), exportForecastComparison: jest.fn() }, downloader: { download: jest.fn() } },
    };
    await createExportPlanning({ ...deps, calendar: [], exporting: false })();
    await createExportPlanning({ ...deps, calendar: [{} as never], exporting: true })();
    expect(exportCalendar).not.toHaveBeenCalled();
  });
});

describe('vacations handler', () => {
  it('loads prepared vacations and their source', async () => {
    const vacations = createState<unknown[]>([]);
    const source = createState<unknown>(null);
    await createLoadVacations({
      gateway: {
        fetchVacations: async (year) => ({
          year, zone: 'C', source: { local: true },
          vacations: [{ name: 'Vacances d’hiver', start: '2026-02-21', end: '2026-03-09' }],
        }),
      },
      setVacations: vacations.set as never,
      setSource: source.set as never,
    })(2026);
    expect(vacations.state.value).toHaveLength(1);
    expect(source.state.value).toEqual({ local: true });
  });

  it('clears the data when loading fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const vacations = createState<unknown[]>([1]);
    const source = createState<unknown>({ local: true });
    await createLoadVacations({
      gateway: { fetchVacations: jest.fn().mockRejectedValue(new Error('x')) },
      setVacations: vacations.set as never,
      setSource: source.set as never,
    })(2026);
    expect(vacations.state.value).toEqual([]);
    expect(source.state.value).toBeNull();
    spy.mockRestore();
  });
});

describe('forecast handlers', () => {
  const holidays = { getHolidays: () => new Set<string>() };

  it('stops on validation errors without calling the gateway', async () => {
    const fetchVacations = jest.fn();
    const error = createState('');
    await createCalculateForecast({
      startYear: 2026,
      yearCount: 10,
      settings: { ...settings, rttDays: '' },
      profiles: PROFILES,
      profile: 'custom',
      setSettings: jest.fn(),
      setRows: jest.fn(),
      setCalculating: jest.fn(),
      setProgress: jest.fn(),
      setError: error.set,
      services: { vacations: { fetchVacations }, holidays },
    })();
    expect(error.state.value).toMatch(/Renseignez/);
    expect(fetchVacations).not.toHaveBeenCalled();
  });

  it('calculates the requested number of rows and resets the progress', async () => {
    const rows = createState<ForecastSummaryRow[]>([]);
    const calculating = createState(false);
    const progress = createState('');
    await createCalculateForecast({
      startYear: 2026,
      yearCount: 5,
      settings,
      profiles: PROFILES,
      profile: 'atsem365',
      setSettings: jest.fn(),
      setRows: rows.set,
      setCalculating: calculating.set,
      setProgress: progress.set,
      setError: jest.fn(),
      services: {
        vacations: {
          fetchVacations: async (year) => ({
            year, zone: 'C', source: { estimated: true },
            vacations: [{ name: 'Grandes vacances', start: `${year}-07-04`, end: `${year}-08-31` }],
          }),
        },
        holidays,
      },
    })();
    expect(rows.state.value).toHaveLength(5);
    expect(calculating.state.value).toBe(false);
    expect(progress.state.value).toBe('');
  });

  it('exports the forecast only when rows are present', async () => {
    const exportForecast = jest.fn().mockResolvedValue(new Blob(['x']));
    const download = jest.fn();
    const base = {
      startYear: 2026,
      profiles: PROFILES,
      profile: 'mairie375' as const,
      exporting: false,
      setExporting: jest.fn(),
      setError: jest.fn(),
      services: { exports: { exportCalendar: jest.fn(), exportForecast, exportForecastComparison: jest.fn() }, downloader: { download } },
    };
    await createExportForecast({ ...base, rows: [] })();
    expect(exportForecast).not.toHaveBeenCalled();

    const rows = Array.from({ length: 10 }, (_, i) => ({
      year: 2026 + i, cpDays: 25, rttDays: 15, totalLeave: 40, workHours: 1500, hoursDue: 107,
    }));
    await createExportForecast({ ...base, rows })();
    expect(exportForecast).toHaveBeenCalledWith({ startYear: 2026, profile: '37h30 MAIRIE', rows }, 'xlsx');
    expect(download).toHaveBeenCalledWith(expect.any(Blob), 'Previsionnel_2026_37h30_MAIRIE.xlsx');
  });
});
