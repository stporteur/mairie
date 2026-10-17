import { useCallback, useEffect, useMemo, useState } from 'react';
import { monthNames } from './utils/constants';
import { allocateLeave } from './services/leave';
import { allocateTraining } from './services/training';
import { buildYearCalendar, getCalendarCellClass } from './services/calendar';
import { adjustVacationDates } from './services/api';
import type { VacationPeriod } from './services/vacations';
import VacationDisplay from './components/VacationDisplay';
import ForecastPage from './components/ForecastPage';
import type { LeaveProfileKey, LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from './types/planner';

const DEFAULT_LEAVE_SETTINGS: LeaveSettings = {
  cpDays: '25',
  rttDays: '9',
  schoolWeeklyHours: '37',
  vacationWeeklyHours: '35',
};
const LEAVE_SETTINGS_STORAGE_KEY = 'planning-atsem-leave-settings';
const LEAVE_PROFILE_STORAGE_KEY = 'planning-atsem-leave-profile';
const APPLIED_LEAVE_PROFILE_STORAGE_KEY = 'planning-atsem-applied-leave-profile';
const LEAVE_SETTING_PROFILES: LeaveProfiles = {
  atsem365: { label: '36h30 ATSEM', rttDays: '9', vacationWeeklyHours: '35', schoolWeeklyHours: '37' },
  atsem375: { label: '37h30 ATSEM', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5' },
  mairie375: { label: '37h30 MAIRIE', rttDays: '15', vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5' },
};
const PROFILE_KEYS = Object.keys(LEAVE_SETTING_PROFILES) as LeaveProfileKey[];
const PROFILE_NAMES: SelectedLeaveProfile[] = [...PROFILE_KEYS, 'custom'];
type PageName = 'planning' | 'forecast';
type LeaveSettingKey = keyof LeaveSettings;

function normalizeQuota(value: string, fallback: number): number {
  if (value === '') return 0;
  const quota = Number(value);
  return Number.isInteger(quota) && quota >= 0 ? quota : fallback;
}

function normalizeWeeklyHours(value: string, fallback: number): number {
  if (value === '') return 0;
  const hours = Number(value);
  return Number.isFinite(hours) && hours >= 0 ? hours : fallback;
}

function normalizeSchoolWeeklyHours(value: string, fallback: number): number {
  const hours = Number(value);
  const quarterHours = hours * 4;
  return Number.isFinite(hours) && hours >= 0 && hours <= 39 &&
    Math.abs(quarterHours - Math.round(quarterHours)) <= 1e-8
    ? hours
    : fallback;
}

function readLeaveSettings(): LeaveSettings {
  const defaults = { ...DEFAULT_LEAVE_SETTINGS };
  if (typeof window === 'undefined') return defaults;

  try {
    const saved = JSON.parse(window.localStorage.getItem(LEAVE_SETTINGS_STORAGE_KEY) || 'null') as Partial<Record<LeaveSettingKey, unknown>> | null;
    return {
      cpDays: String(normalizeQuota(String(saved?.cpDays ?? defaults.cpDays), Number(defaults.cpDays))),
      rttDays: String(normalizeQuota(String(saved?.rttDays ?? defaults.rttDays), Number(defaults.rttDays))),
      schoolWeeklyHours: String(normalizeSchoolWeeklyHours(String(saved?.schoolWeeklyHours ?? defaults.schoolWeeklyHours), Number(defaults.schoolWeeklyHours))),
      vacationWeeklyHours: String(normalizeWeeklyHours(String(saved?.vacationWeeklyHours ?? defaults.vacationWeeklyHours), Number(defaults.vacationWeeklyHours))),
    };
  } catch {
    return defaults;
  }
}

function readLeaveProfile(): SelectedLeaveProfile {
  if (typeof window === 'undefined') return 'atsem365';
  try {
    const saved = window.localStorage.getItem(LEAVE_PROFILE_STORAGE_KEY);
    if (PROFILE_NAMES.includes(saved as SelectedLeaveProfile)) return saved as SelectedLeaveProfile;

    const settings = readLeaveSettings();
    return PROFILE_KEYS.find((key) => {
      const profile = LEAVE_SETTING_PROFILES[key];
      return profile.rttDays === settings.rttDays &&
        profile.vacationWeeklyHours === settings.vacationWeeklyHours &&
        profile.schoolWeeklyHours === settings.schoolWeeklyHours;
    }) || 'custom';
  } catch {
    return 'atsem365';
  }
}

function readAppliedLeaveProfile(): SelectedLeaveProfile {
  if (typeof window === 'undefined') return 'atsem365';
  try {
    const saved = window.localStorage.getItem(APPLIED_LEAVE_PROFILE_STORAGE_KEY);
    if (PROFILE_NAMES.includes(saved as SelectedLeaveProfile)) return saved as SelectedLeaveProfile;
  } catch {
    // Fall back to the saved settings below.
  }

  const settings = readLeaveSettings();
  return PROFILE_KEYS.find((key) => {
    const profile = LEAVE_SETTING_PROFILES[key];
    return profile.rttDays === settings.rttDays &&
      profile.vacationWeeklyHours === settings.vacationWeeklyHours &&
      profile.schoolWeeklyHours === settings.schoolWeeklyHours;
  }) || 'custom';
}

function readLeaveDraftSettings(profileName: SelectedLeaveProfile): LeaveSettings {
  const savedSettings = readLeaveSettings();
  if (typeof window === 'undefined') return savedSettings;
  if (profileName === 'custom') {
    return { ...savedSettings, rttDays: '', vacationWeeklyHours: '', schoolWeeklyHours: '' };
  }
  const profile = LEAVE_SETTING_PROFILES[profileName];
  return {
    ...savedSettings,
    rttDays: profile.rttDays,
    vacationWeeklyHours: profile.vacationWeeklyHours,
    schoolWeeklyHours: profile.schoolWeeklyHours,
  };
}

function App() {
  const [year, setYear] = useState<number>(2026);
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [trainingByMonth] = useState<number[]>(Array.from({ length: 12 }, () => 0));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState<PageName>('planning');
  const [selectedLeaveProfile, setSelectedLeaveProfile] = useState<SelectedLeaveProfile>(readLeaveProfile);
  const [leaveSettings, setLeaveSettings] = useState<LeaveSettings>(() => readLeaveDraftSettings(readLeaveProfile()));
  const [appliedLeaveSettings, setAppliedLeaveSettings] = useState<LeaveSettings>(readLeaveSettings);
  const [appliedLeaveProfile, setAppliedLeaveProfile] = useState<SelectedLeaveProfile>(readAppliedLeaveProfile);
  const [calculationError, setCalculationError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const cpQuota = normalizeQuota(appliedLeaveSettings.cpDays, Number(DEFAULT_LEAVE_SETTINGS.cpDays));
  const rttQuota = normalizeQuota(appliedLeaveSettings.rttDays, Number(DEFAULT_LEAVE_SETTINGS.rttDays));
  const schoolWeeklyHours = normalizeWeeklyHours(appliedLeaveSettings.schoolWeeklyHours, Number(DEFAULT_LEAVE_SETTINGS.schoolWeeklyHours));
  const vacationWeeklyHours = normalizeWeeklyHours(appliedLeaveSettings.vacationWeeklyHours, Number(DEFAULT_LEAVE_SETTINGS.vacationWeeklyHours));

  useEffect(() => {
    try {
      window.localStorage.setItem(LEAVE_SETTINGS_STORAGE_KEY, JSON.stringify({
        cpDays: cpQuota,
        rttDays: rttQuota,
        schoolWeeklyHours,
        vacationWeeklyHours,
      }));
    } catch {
      // Keep the settings usable if browser storage is unavailable.
    }
  }, [cpQuota, rttQuota, schoolWeeklyHours, vacationWeeklyHours]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LEAVE_PROFILE_STORAGE_KEY, selectedLeaveProfile);
    } catch {
      // Keep profile selection usable if browser storage is unavailable.
    }
  }, [selectedLeaveProfile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(APPLIED_LEAVE_PROFILE_STORAGE_KEY, appliedLeaveProfile);
    } catch {
      // Keep applied calculations usable if browser storage is unavailable.
    }
  }, [appliedLeaveProfile]);

  const handleVacationsLoaded = useCallback((loadedVacations: VacationPeriod[]) => {
    setVacations(loadedVacations);
  }, []);
  const handleLoadingChange = useCallback((_loading: boolean) => undefined, []);
  const handleYearChange = useCallback((newYear: number) => setYear(newYear), []);

  const calendarInfo = useMemo(() => {
    if (!vacations.length) return null;
    const schoolWorkdaysPerWeek = appliedLeaveProfile === 'mairie375' ? 5 : 4;
    const calendar = buildYearCalendar(year, vacations, vacationWeeklyHours, schoolWeeklyHours, schoolWorkdaysPerWeek);
    return allocateLeave(calendar, vacations, cpQuota, rttQuota);
  }, [year, vacations, cpQuota, rttQuota, schoolWeeklyHours, vacationWeeklyHours, appliedLeaveProfile]);

  const totalTrainingHours = trainingByMonth.reduce((total, value) => total + Number(value || 0), 0);
  const totalWorkHours = calendarInfo
    ? calendarInfo.calendar.reduce((total, day) => total + day.effectiveHours, 0)
    : 0;
  const hoursDue = 1607 - totalWorkHours;
  const totalHours = Number((totalWorkHours + totalTrainingHours).toFixed(2));
  const cpCount = calendarInfo ? calendarInfo.cpDates.size : 0;
  const rttCount = calendarInfo ? calendarInfo.rttDates.size : 0;
  const totalLeave = cpCount + rttCount;
  const expectedLeave = cpQuota + rttQuota;
  const totalOffWarning = totalLeave !== expectedLeave;
  const hoursWarning = totalHours > 1607;

  const calendarWithTraining = useMemo(
    () => calendarInfo ? allocateTraining(calendarInfo.calendar, trainingByMonth) : [],
    [calendarInfo, trainingByMonth],
  );

  const monthlySummaries = calendarInfo
    ? monthNames.map((monthName, monthIndex) => {
        const days = calendarWithTraining.filter((day) => day.month === monthIndex);
        return {
          monthName,
          workHours: Number(days.reduce((sum, day) => sum + day.effectiveHours, 0).toFixed(2)),
          trainingHours: Number(days.reduce((sum, day) => sum + day.trainingHours, 0).toFixed(2)),
          cpDays: days.filter((day) => day.isCp).length,
          rttDays: days.filter((day) => day.isRtt).length,
          vacationDays: days.filter((day) => day.inVacation && day.isWorkday && !day.isCp && !day.isRtt).length,
        };
      })
    : [];

  const handleLeaveSettingChange = (setting: LeaveSettingKey, value: string) => {
    setLeaveSettings((current) => ({ ...current, [setting]: value }));
    if (setting !== 'cpDays') setSelectedLeaveProfile('custom');
  };

  const handleLeaveProfileChange = (profileName: SelectedLeaveProfile) => {
    setSelectedLeaveProfile(profileName);
    if (profileName === 'custom') {
      setLeaveSettings((current) => ({ ...current, rttDays: '', vacationWeeklyHours: '', schoolWeeklyHours: '' }));
      setCalculationError('');
      return;
    }
    const profile = LEAVE_SETTING_PROFILES[profileName];
    setLeaveSettings((current) => ({
      ...current,
      rttDays: profile.rttDays,
      vacationWeeklyHours: profile.vacationWeeklyHours,
      schoolWeeklyHours: profile.schoolWeeklyHours,
    }));
    setCalculationError('');
  };

  const handleLeaveSettingBlur = (setting: LeaveSettingKey) => {
    if (setting === 'schoolWeeklyHours' || leaveSettings[setting] === '') return;
    const fallback = Number(DEFAULT_LEAVE_SETTINGS[setting]);
    setLeaveSettings((current) => ({
      ...current,
      [setting]: String(setting === 'cpDays' || setting === 'rttDays'
        ? normalizeQuota(current[setting], fallback)
        : normalizeWeeklyHours(current[setting], fallback)),
    }));
  };

  const handleCalculate = () => {
    const schoolHours = Number(leaveSettings.schoolWeeklyHours);
    const schoolQuarterHours = schoolHours * 4;
    if (
      leaveSettings.schoolWeeklyHours.trim() === '' ||
      !Number.isFinite(schoolHours) ||
      schoolHours < 0 ||
      schoolHours > 39 ||
      Math.abs(schoolQuarterHours - Math.round(schoolQuarterHours)) > 1e-8
    ) {
      setCalculationError('Les heures/semaine Scolaire doivent être un multiple de 0,25 h compris entre 0 et 39 h.');
      return;
    }

    const nextSettings: LeaveSettings = {
      cpDays: String(normalizeQuota(leaveSettings.cpDays, Number(DEFAULT_LEAVE_SETTINGS.cpDays))),
      rttDays: String(normalizeQuota(leaveSettings.rttDays, Number(DEFAULT_LEAVE_SETTINGS.rttDays))),
      schoolWeeklyHours: String(normalizeWeeklyHours(leaveSettings.schoolWeeklyHours, Number(DEFAULT_LEAVE_SETTINGS.schoolWeeklyHours))),
      vacationWeeklyHours: String(normalizeWeeklyHours(leaveSettings.vacationWeeklyHours, Number(DEFAULT_LEAVE_SETTINGS.vacationWeeklyHours))),
    };
    setLeaveSettings(nextSettings);
    setAppliedLeaveSettings(nextSettings);
    setAppliedLeaveProfile(selectedLeaveProfile);
    setCalculationError('');
  };

  const handleExport = async () => {
    if (!calendarWithTraining.length || exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const exportProfile = selectedLeaveProfile === 'custom'
        ? 'Custom'
        : LEAVE_SETTING_PROFILES[selectedLeaveProfile].label;
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          profile: exportProfile,
          days: calendarWithTraining.map((day) => ({
            date: day.date,
            effectiveHours: day.effectiveHours,
            isWeekend: day.isWeekend,
            isHoliday: day.isHoliday,
            inVacation: day.inVacation,
            vacationEstimated: day.vacationEstimated,
            isWednesdayRest: day.isWednesdayRest,
            isCp: day.isCp,
            isRtt: day.isRtt,
          })),
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error || `Échec de l’export (${response.status}).`);
      }
      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Planing_${year}_${exportProfile.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportFailure) {
      setExportError(exportFailure instanceof Error ? exportFailure.message : 'Erreur pendant la création du fichier Excel.');
    } finally {
      setExporting(false);
    }
  };

  const monthlyTables = monthNames.map((_, monthIndex) => calendarWithTraining.filter((day) => day.month === monthIndex));

  return (
    <div className={`portal-shell ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)} title="Basculer le menu">☰</button>
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="brand"><span>L'Haÿ-les-Roses</span></div>
        <nav>
          <button className={`nav-item ${activePage === 'planning' ? 'active' : ''}`} type="button" onClick={() => setActivePage('planning')} aria-current={activePage === 'planning' ? 'page' : undefined}>Planning ATSEM</button>
          <button className={`nav-item ${activePage === 'forecast' ? 'active' : ''}`} type="button" onClick={() => setActivePage('forecast')} aria-current={activePage === 'forecast' ? 'page' : undefined}>Prévisionnel</button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="banner">
          <div>
            <h1>{activePage === 'planning' ? 'Planning ATSEM' : 'Prévisionnel'}</h1>
            <p>{activePage === 'planning' ? 'Analyse annuelle du temps de travail, des congés et de la formation.' : 'Projection des heures et congés sur les dix prochaines années.'}</p>
          </div>
        </header>

        {activePage === 'planning' ? (
          <>
            <section className="config-panel">
              <div className="card">
                <h2>Paramètres</h2>
                <fieldset className="leave-profile-options" aria-label="Profils horaires">
                  {PROFILE_KEYS.map((profileName) => {
                    const profile = LEAVE_SETTING_PROFILES[profileName];
                    return (
                      <label key={profileName} className="leave-profile-option">
                        <input type="radio" name="leave-profile" value={profileName} checked={selectedLeaveProfile === profileName} onChange={() => handleLeaveProfileChange(profileName)} />
                        <span><strong>{profile.label}</strong><small>{profile.rttDays} jours RTT · {profile.vacationWeeklyHours} h vacances · {profile.schoolWeeklyHours} h scolaire</small></span>
                      </label>
                    );
                  })}
                  <label className="leave-profile-option">
                    <input type="radio" name="leave-profile" value="custom" checked={selectedLeaveProfile === 'custom'} onChange={() => handleLeaveProfileChange('custom')} />
                    <span><strong>Custom</strong></span>
                  </label>
                </fieldset>
                <div className="month-grid leave-settings-grid">
                  <label className="month-input"><span>Jours de CP</span><input type="number" min="0" step="1" value={leaveSettings.cpDays} onChange={(event) => handleLeaveSettingChange('cpDays', event.target.value)} onBlur={() => handleLeaveSettingBlur('cpDays')} /></label>
                  <label className="month-input"><span>Jours de RTT</span><input type="number" min="0" step="1" value={leaveSettings.rttDays} onChange={(event) => handleLeaveSettingChange('rttDays', event.target.value)} onBlur={() => handleLeaveSettingBlur('rttDays')} /></label>
                  <label className="month-input"><span>Heures/semaine Scolaire</span><input type="number" min="0" step="0.25" value={leaveSettings.schoolWeeklyHours} onChange={(event) => { handleLeaveSettingChange('schoolWeeklyHours', event.target.value); setCalculationError(''); }} onBlur={() => handleLeaveSettingBlur('schoolWeeklyHours')} /></label>
                  <label className="month-input"><span>Heure/semaine Vacances</span><input type="number" min="0" step="0.25" value={leaveSettings.vacationWeeklyHours} onChange={(event) => handleLeaveSettingChange('vacationWeeklyHours', event.target.value)} onBlur={() => handleLeaveSettingBlur('vacationWeeklyHours')} /></label>
                </div>
                <p className="help-text">Les paramètres sont appliqués au calendrier uniquement après clic sur « Calculer ».</p>
                {calculationError ? <div className="alert" role="alert">{calculationError}</div> : null}
                <button className="primary-button calculate-button" type="button" onClick={handleCalculate}>Calculer</button>
              </div>
              <VacationDisplay year={year} onVacationsLoaded={handleVacationsLoaded} onLoadingChange={handleLoadingChange} onYearChange={handleYearChange} />
            </section>

            <section className="stats-grid">
              <article className="summary-card">
                <h2 className="summary-title">Récapitulatif</h2>
                <div className="summary-items">
                  <div className="summary-item"><h3>{cpCount}</h3><p>Jours de CP posés</p></div>
                  <div className="summary-item"><h3>{rttCount}</h3><p>Jours de RTT posés</p></div>
                  <div className="summary-item"><h3>{totalLeave}</h3><p>Congés totaux posés</p></div>
                  <div className="summary-item"><h3>{totalWorkHours.toFixed(2)}</h3><p>Heures de travail calculées</p></div>
                  <div className="summary-item"><h3>{hoursDue.toFixed(2)}</h3><p>Heures dues</p></div>
                </div>
              </article>
            </section>

            <section className="warnings">
              {totalOffWarning ? <div className="alert">Total des congés posés : {totalLeave} jours. Le total attendu selon vos réglages est de {expectedLeave} jours.</div> : null}
              {hoursWarning ? <div className="alert">Total heures (travail + formation) : {totalHours} h. Attention, cela dépasse la limite de 1607 h.</div> : null}
            </section>

            <section className="month-cards">
              {monthlyTables.map((days, monthIndex) => (
                <div key={monthIndex} className="month-card">
                  <h3>{monthNames[monthIndex]}</h3>
                  <div className="month-table-wrapper">
                    <table className="month-calendar">
                      <thead>
                        <tr>
                          <th rowSpan={2} aria-label="Jour" title="Jour">J</th>
                          {days.map((day) => {
                            const headerClass = day.inVacation ? day.vacationEstimated ? 'vacation-day-header estimated-vacation-day-header' : 'vacation-day-header' : '';
                            const weekdayIndex = new Date(`${day.date}T00:00:00Z`).getUTCDay();
                            const dayInitial = ['D', 'L', 'M', 'Me', 'J', 'V', 'S'][weekdayIndex];
                            return <th key={`${day.date}-initial`} className={headerClass}>{dayInitial}</th>;
                          })}
                        </tr>
                        <tr>
                          {days.map((day) => {
                            const headerClass = day.inVacation ? day.vacationEstimated ? 'vacation-day-header estimated-vacation-day-header' : 'vacation-day-header' : '';
                            return <th key={`${day.date}-number`} className={headerClass}>{Number(day.date.slice(-2))}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th aria-label="Heures travail" title="Heures travail">T</th>
                          {days.map((day) => {
                            const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
                            const defaultClass = day.inVacation
                              ? (day.isWeekend ? 'vacation-weekend-cell' : 'vacation-weekday-cell')
                              : (weekday === 0 || weekday === 6 || weekday === 3 ? 'normal-gray-cell' : 'normal-white-cell');
                            return <td key={`${day.date}-work`} className={getCalendarCellClass(day, defaultClass)}>{day.effectiveHours ? day.effectiveHours.toFixed(2) : '-'}</td>;
                          })}
                        </tr>
                        <tr>
                          <th aria-label="Congés" title="Congés">C</th>
                          {days.map((day) => {
                            const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
                            const defaultClass = day.inVacation
                              ? (day.isWeekend ? 'vacation-weekend-cell' : 'vacation-weekday-cell')
                              : (weekday === 0 || weekday === 6 || weekday === 3 ? 'normal-gray-cell' : 'normal-white-cell');
                            return <td key={`${day.date}-leave`} className={getCalendarCellClass(day, defaultClass)}>{day.isCp ? 'CP' : day.isRtt ? 'RTT' : ''}</td>;
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>

            <section className="planning-table">
              <h2>Récapitulatif par mois</h2>
              <table>
                <thead><tr><th>Mois</th><th>Heures de travail</th><th>CP</th><th>RTT</th><th>Jours de vacances</th></tr></thead>
                <tbody>{monthlySummaries.map((summary) => <tr key={summary.monthName}><td>{summary.monthName}</td><td>{summary.workHours.toFixed(2)}</td><td>{summary.cpDays}</td><td>{summary.rttDays}</td><td>{summary.vacationDays}</td></tr>)}</tbody>
              </table>
            </section>

            <div className="export-actions">
              {exportError ? <p className="alert" role="alert">{exportError}</p> : null}
              <button className="primary-button export-button" type="button" onClick={handleExport} disabled={!calendarWithTraining.length || exporting}>{exporting ? 'Export en cours…' : 'Export'}</button>
            </div>
          </>
        ) : (
          <ForecastPage key={`${year}-${selectedLeaveProfile}`} startYear={year} profiles={LEAVE_SETTING_PROFILES} initialSettings={leaveSettings} initialProfile={selectedLeaveProfile} />
        )}
      </main>
    </div>
  );
}

export default App;
