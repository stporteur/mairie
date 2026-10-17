import { useState } from 'react';
import { buildYearCalendar } from '../services/calendar';
import { allocateLeave } from '../services/leave';
import { adjustVacationDates, fetchSchoolVacations } from '../services/api';
import {
  ForecastSummaryRow,
  LeaveProfiles,
  LeaveSettings,
  SelectedLeaveProfile,
} from '../types/planner';

interface ForecastPageProps {
  startYear: number;
  profiles: LeaveProfiles;
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
}

const DEFAULT_LEAVE_SETTINGS: LeaveSettings = {
  cpDays: '25',
  rttDays: '9',
  schoolWeeklyHours: '37',
  vacationWeeklyHours: '35',
};

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

function ForecastPage({ startYear, profiles, initialSettings, initialProfile }: ForecastPageProps) {
  const [settings, setSettings] = useState<LeaveSettings>(() => ({ ...initialSettings }));
  const [selectedProfile, setSelectedProfile] = useState<SelectedLeaveProfile>(initialProfile);
  const [rows, setRows] = useState<ForecastSummaryRow[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleSettingChange = (key: keyof LeaveSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
    if (key !== 'cpDays') setSelectedProfile('custom');
  };

  const handleProfileChange = (profileKey: SelectedLeaveProfile) => {
    setSelectedProfile(profileKey);
    if (profileKey === 'custom') {
      setSettings((current) => ({
        ...current,
        rttDays: '',
        schoolWeeklyHours: '',
        vacationWeeklyHours: '',
      }));
      setError('');
      return;
    }

    const profile = profiles[profileKey];
    setSettings((current) => ({
      ...current,
      rttDays: profile.rttDays,
      schoolWeeklyHours: profile.schoolWeeklyHours,
      vacationWeeklyHours: profile.vacationWeeklyHours,
    }));
    setError('');
  };

  const handleCalculate = async () => {
    const schoolHours = Number(settings.schoolWeeklyHours);
    const quarterHours = schoolHours * 4;
    if (
      settings.schoolWeeklyHours === '' ||
      !Number.isFinite(schoolHours) ||
      schoolHours < 0 ||
      schoolHours > 39 ||
      Math.abs(quarterHours - Math.round(quarterHours)) > 1e-8
    ) {
      setError('Les heures/semaine scolaire doivent être un multiple de 0,25 h compris entre 0 et 39 h.');
      return;
    }
    if (settings.rttDays === '' || settings.vacationWeeklyHours === '') {
      setError('Renseignez le nombre de RTT et les heures/semaine en vacances.');
      return;
    }

    const cpQuota = normalizeQuota(settings.cpDays, Number(DEFAULT_LEAVE_SETTINGS.cpDays));
    const rttQuota = normalizeQuota(settings.rttDays, Number(DEFAULT_LEAVE_SETTINGS.rttDays));
    const schoolWeeklyHours = normalizeWeeklyHours(settings.schoolWeeklyHours, Number(DEFAULT_LEAVE_SETTINGS.schoolWeeklyHours));
    const vacationWeeklyHours = normalizeWeeklyHours(settings.vacationWeeklyHours, Number(DEFAULT_LEAVE_SETTINGS.vacationWeeklyHours));
    const schoolWorkdaysPerWeek = selectedProfile === 'mairie375' ? 5 : 4;
    const nextRows: ForecastSummaryRow[] = [];

    setCalculating(true);
    setError('');
    setRows([]);
    try {
      for (let offset = 0; offset < 10; offset += 1) {
        const year = startYear + offset;
        setProgress(`Calcul de ${year} (${offset + 1}/10)…`);
        const data = await fetchSchoolVacations(year);
        const vacationPeriods = adjustVacationDates(
          data.vacations
            .filter((vacation) => vacation.name?.toLowerCase().includes('vacances'))
            .map((vacation) => ({
              ...vacation,
              estimated: vacation.estimated ?? data.source?.estimated === true,
            })),
          year,
        );
        const calendar = buildYearCalendar(
          year,
          vacationPeriods,
          vacationWeeklyHours,
          schoolWeeklyHours,
          schoolWorkdaysPerWeek,
        );
        const allocation = allocateLeave(calendar, vacationPeriods, cpQuota, rttQuota);
        const workHours = allocation.calendar.reduce((total, day) => total + day.effectiveHours, 0);
        const cpDays = allocation.cpDates.size;
        const rttDays = allocation.rttDates.size;

        nextRows.push({
          year,
          cpDays,
          rttDays,
          totalLeave: cpDays + rttDays,
          workHours: Number(workHours.toFixed(2)),
          hoursDue: Number((1607 - workHours).toFixed(2)),
        });
      }

      setRows(nextRows);
      setSettings((current) => ({
        ...current,
        cpDays: String(cpQuota),
        rttDays: String(rttQuota),
        schoolWeeklyHours: String(schoolWeeklyHours),
        vacationWeeklyHours: String(vacationWeeklyHours),
      }));
    } catch (calculationError) {
      setError(calculationError instanceof Error ? calculationError.message : 'Impossible de calculer le prévisionnel.');
    } finally {
      setCalculating(false);
      setProgress('');
    }
  };

  const handleExport = async () => {
    if (rows.length !== 10 || exporting) return;
    setExporting(true);
    setError('');
    try {
      const response = await fetch('/api/export/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startYear,
          profile: profiles[selectedProfile as keyof LeaveProfiles]?.label || 'Custom',
          rows,
        }),
      });
      if (!response.ok) {
        const result: { error?: string } | null = await response.json().catch(() => null);
        throw new Error(result?.error || `Échec de l’export (${response.status}).`);
      }

      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Previsionnel_${startYear}_${profiles[selectedProfile as keyof LeaveProfiles]?.label || 'Custom'}`
        .replace(/[^a-zA-Z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '') + '.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Impossible d’exporter le prévisionnel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <section className="config-panel forecast-config-panel">
        <div className="card">
          <h2>Paramètres</h2>
          <fieldset className="leave-profile-options" aria-label="Profils horaires prévisionnel">
            {Object.entries(profiles).map(([profileKey, profile]) => (
              <label key={profileKey} className="leave-profile-option">
                <input
                  type="radio"
                  name="forecast-leave-profile"
                  value={profileKey}
                  checked={selectedProfile === profileKey}
                  onChange={() => handleProfileChange(profileKey as SelectedLeaveProfile)}
                />
                <span>
                  <strong>{profile.label}</strong>
                  <small>{profile.rttDays} jours RTT · {profile.vacationWeeklyHours} h vacances · {profile.schoolWeeklyHours} h scolaire</small>
                </span>
              </label>
            ))}
            <label className="leave-profile-option">
              <input
                type="radio"
                name="forecast-leave-profile"
                value="custom"
                checked={selectedProfile === 'custom'}
                onChange={() => handleProfileChange('custom')}
              />
              <span><strong>Custom</strong></span>
            </label>
          </fieldset>
          <div className="month-grid leave-settings-grid">
            <label className="month-input">
              <span>Jours de CP</span>
              <input type="number" min="0" step="1" value={settings.cpDays} onChange={(event) => handleSettingChange('cpDays', event.target.value)} />
            </label>
            <label className="month-input">
              <span>Jours de RTT</span>
              <input type="number" min="0" step="1" value={settings.rttDays} onChange={(event) => handleSettingChange('rttDays', event.target.value)} />
            </label>
            <label className="month-input">
              <span>Heures/semaine Scolaire</span>
              <input type="number" min="0" step="0.25" value={settings.schoolWeeklyHours} onChange={(event) => handleSettingChange('schoolWeeklyHours', event.target.value)} />
            </label>
            <label className="month-input">
              <span>Heures/semaine Vacances</span>
              <input type="number" min="0" step="0.25" value={settings.vacationWeeklyHours} onChange={(event) => handleSettingChange('vacationWeeklyHours', event.target.value)} />
            </label>
          </div>
          <p className="help-text">Années calculées : {startYear}–{startYear + 9}. Les paramètres s’appliquent au prévisionnel après « Calculer ».</p>
          {error ? <div className="alert" role="alert">{error}</div> : null}
          {progress ? <p className="help-text" role="status">{progress}</p> : null}
          <button className="primary-button calculate-button" type="button" onClick={handleCalculate} disabled={calculating}>
            {calculating ? 'Calcul en cours…' : 'Calculer'}
          </button>
        </div>
      </section>

      {rows.length > 0 ? (
        <>
          <section className="planning-table forecast-table-section">
            <h2>Prévisionnel {startYear}–{startYear + 9}</h2>
            <table>
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Jours de CP</th>
                  <th>Jours de RTT</th>
                  <th>Congés totaux</th>
                  <th>Heures de travail calculées</th>
                  <th>Heures dues</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td>{row.cpDays}</td>
                    <td>{row.rttDays}</td>
                    <td>{row.totalLeave}</td>
                    <td>{row.workHours.toFixed(2)}</td>
                    <td>{row.hoursDue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <div className="export-actions">
            <button className="primary-button export-button" type="button" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Export en cours…' : 'Export Excel'}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

export default ForecastPage;
