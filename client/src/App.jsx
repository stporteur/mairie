import { useMemo, useState, useEffect } from 'react';
import { monthNames, VACATION_KEYWORDS, getDefaultVacationRanges } from './utils/constants';
import { formatIso, parseIso, getPentecostMonday } from './utils/date';
import { buildVacationsFromRanges, createHolidaySet, findVacationPeriods } from './services/vacations';
import { buildYearCalendar, getCalendarCellClass } from './services/calendar';
import { allocateLeave } from './services/leave';
import { allocateTraining } from './services/training';
import { fetchSchoolVacations, adjustVacationDates } from './services/api';
import VacationDisplay from './components/VacationDisplay';

const DEFAULT_LEAVE_SETTINGS = {
  cpDays: 25,
  rttDays: 9,
  schoolWeeklyHours: 37,
  vacationWeeklyHours: 35,
};
const LEAVE_SETTINGS_STORAGE_KEY = 'planning-atsem-leave-settings';

function normalizeQuota(value, fallback) {
  if (value === '') return 0;
  const quota = Number(value);
  return Number.isInteger(quota) && quota >= 0 ? quota : fallback;
}

function normalizeWeeklyHours(value, fallback) {
  if (value === '') return 0;
  const hours = Number(value);
  return Number.isFinite(hours) && hours >= 0 ? hours : fallback;
}

function normalizeSchoolWeeklyHours(value, fallback) {
  const hours = Number(value);
  const quarterHours = hours * 4;
  return Number.isFinite(hours) && hours >= 0 && hours <= 39 &&
    Math.abs(quarterHours - Math.round(quarterHours)) <= 1e-8
    ? hours
    : fallback;
}

function readLeaveSettings() {
  if (typeof window === 'undefined') {
    return Object.fromEntries(
      Object.entries(DEFAULT_LEAVE_SETTINGS).map(([key, value]) => [key, String(value)]),
    );
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(LEAVE_SETTINGS_STORAGE_KEY) || 'null');
    return Object.fromEntries(
      Object.entries(DEFAULT_LEAVE_SETTINGS).map(([key, fallback]) => {
        const value = key === 'cpDays' || key === 'rttDays'
          ? normalizeQuota(saved?.[key], fallback)
          : key === 'schoolWeeklyHours'
            ? normalizeSchoolWeeklyHours(saved?.[key], fallback)
            : normalizeWeeklyHours(saved?.[key], fallback);
        return [key, String(value)];
      }),
    );
  } catch {
    return Object.fromEntries(
      Object.entries(DEFAULT_LEAVE_SETTINGS).map(([key, value]) => [key, String(value)]),
    );
  }
}

function App() {
  const [year, setYear] = useState(2026);
  const [vacations, setVacations] = useState([]);
  const [vacationSource, setVacationSource] = useState(null);
  const [loadingVacations, setLoadingVacations] = useState(false);
  const [trainingByMonth, setTrainingByMonth] = useState(Array.from({ length: 12 }, () => 0));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [leaveSettings, setLeaveSettings] = useState(readLeaveSettings);
  const [appliedLeaveSettings, setAppliedLeaveSettings] = useState(readLeaveSettings);
  const [calculationError, setCalculationError] = useState('');
  const cpQuota = normalizeQuota(appliedLeaveSettings.cpDays, DEFAULT_LEAVE_SETTINGS.cpDays);
  const rttQuota = normalizeQuota(appliedLeaveSettings.rttDays, DEFAULT_LEAVE_SETTINGS.rttDays);
  const schoolWeeklyHours = normalizeWeeklyHours(appliedLeaveSettings.schoolWeeklyHours, DEFAULT_LEAVE_SETTINGS.schoolWeeklyHours);
  const vacationWeeklyHours = normalizeWeeklyHours(appliedLeaveSettings.vacationWeeklyHours, DEFAULT_LEAVE_SETTINGS.vacationWeeklyHours);

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

    const handleVacationsLoaded = (vacations) => {
      setVacations(vacations);
    };

    const handleLoadingChange = (loading) => {
      setLoadingVacations(loading);
    };

    const handleYearChange = (newYear) => {
      setYear(newYear);
    };

  const calendarInfo = useMemo(() => {
    if (!vacations.length) {
      return null;
    }
    const calendar = buildYearCalendar(year, vacations, vacationWeeklyHours, schoolWeeklyHours);
    return allocateLeave(calendar, vacations, cpQuota, rttQuota);
  }, [year, vacations, cpQuota, rttQuota, schoolWeeklyHours, vacationWeeklyHours]);

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
        trainingHours: Number(days.reduce((sum, day) => sum + (day.trainingHours || 0), 0).toFixed(2)),
        cpDays: days.filter((day) => day.isCp).length,
        rttDays: days.filter((day) => day.isRtt).length,
        vacationDays: days.filter((day) => day.inVacation && day.isWorkday && !day.isCp && !day.isRtt).length,
      };
    })
  : [];

  const handleTrainingChange = (index, value) => {
    const next = [...trainingByMonth];
    next[index] = Number(value || 0);
    setTrainingByMonth(next);
  };

  const handleLeaveSettingChange = (setting, value) => {
    setLeaveSettings((current) => ({ ...current, [setting]: value }));
  };

  const handleLeaveSettingBlur = (setting) => {
    if (setting === 'schoolWeeklyHours') return;

    const fallback = DEFAULT_LEAVE_SETTINGS[setting];
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

    const nextSettings = {
      cpDays: String(normalizeQuota(leaveSettings.cpDays, DEFAULT_LEAVE_SETTINGS.cpDays)),
      rttDays: String(normalizeQuota(leaveSettings.rttDays, DEFAULT_LEAVE_SETTINGS.rttDays)),
      schoolWeeklyHours: String(normalizeWeeklyHours(leaveSettings.schoolWeeklyHours, DEFAULT_LEAVE_SETTINGS.schoolWeeklyHours)),
      vacationWeeklyHours: String(normalizeWeeklyHours(leaveSettings.vacationWeeklyHours, DEFAULT_LEAVE_SETTINGS.vacationWeeklyHours)),
    };
    setLeaveSettings(nextSettings);
    setAppliedLeaveSettings(nextSettings);
    setCalculationError('');
  };

  const monthlyTables = monthNames.map((_, monthIndex) =>
    calendarWithTraining.filter((day) => day.month === monthIndex),
  );

  const normalizeDate = (value) => value.slice(0, 10);
  
  return (
    <div className={`portal-shell ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Basculer le menu"
      >
        ☰
      </button>
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="brand">
          <span>Marie de L'Haÿ-les-Roses</span>
        </div>
        <nav>
          <button className="nav-item active">Planning ATSEM</button>
        </nav>
        <div className="footer-note">Calcul des heures, congés et vacances scolaires</div>
      </aside>

      <main className="main-content">
        <header className="banner">
          <div>
            <p className="eyebrow">Portail applicatif</p>
            <h1>Planning ATSEM</h1>
            <p>Analyse annuelle du temps de travail, des congés et de la formation.</p>
          </div>
        </header>

                <section className="config-panel">
          <div className="card">
            <h2>Paramètres</h2>
            <div className="month-grid leave-settings-grid">
              <label className="month-input">
                <span>Jours de CP</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={leaveSettings.cpDays}
                  onChange={(event) => handleLeaveSettingChange('cpDays', event.target.value)}
                  onBlur={() => handleLeaveSettingBlur('cpDays')}
                />
              </label>
              <label className="month-input">
                <span>Jours de RTT</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={leaveSettings.rttDays}
                  onChange={(event) => handleLeaveSettingChange('rttDays', event.target.value)}
                  onBlur={() => handleLeaveSettingBlur('rttDays')}
                />
              </label>
              <label className="month-input">
                <span>Heures/semaine Scolaire</span>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={leaveSettings.schoolWeeklyHours}
                  onChange={(event) => {
                    handleLeaveSettingChange('schoolWeeklyHours', event.target.value);
                    setCalculationError('');
                  }}
                  onBlur={() => handleLeaveSettingBlur('schoolWeeklyHours')}
                />
              </label>
              <label className="month-input">
                <span>Heure/semaine Vacances</span>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={leaveSettings.vacationWeeklyHours}
                  onChange={(event) => handleLeaveSettingChange('vacationWeeklyHours', event.target.value)}
                  onBlur={() => handleLeaveSettingBlur('vacationWeeklyHours')}
                />
              </label>
            </div>
            <p className="help-text">Les paramètres sont appliqués au calendrier uniquement après clic sur « Calculer ».</p>
            {calculationError && <div className="alert" role="alert">{calculationError}</div>}
            <button className="primary-button calculate-button" type="button" onClick={handleCalculate}>
              Calculer
            </button>
          </div>

          <VacationDisplay
            year={year}
            onVacationsLoaded={handleVacationsLoaded}
            onLoadingChange={handleLoadingChange}
            onYearChange={handleYearChange}
          />

        </section>

        <section className="stats-grid">
          <article className="summary-card">
            <h2 className="summary-title">Récapitulatif</h2>
            <div className="summary-items">
              <div className="summary-item">
                <h3>{cpCount}</h3>
                <p>Jours de CP posés</p>
              </div>
              <div className="summary-item">
                <h3>{rttCount}</h3>
                <p>Jours de RTT posés</p>
              </div>
              <div className="summary-item">
                <h3>{totalLeave}</h3>
                <p>Congés totaux posés</p>
              </div>
              <div className="summary-item">
                <h3>{totalWorkHours.toFixed(2)}</h3>
                <p>Heures de travail calculées</p>
              </div>
              <div className="summary-item">
                <h3>{hoursDue.toFixed(2)}</h3>
                <p>Heures dues</p>
              </div>
            </div>
          </article>
        </section>

        <section className="warnings">
          {totalOffWarning && (
            <div className="alert">
              Total des congés posés : {totalLeave} jours. Le total attendu selon vos réglages est de {expectedLeave} jours.
            </div>
          )}
          {hoursWarning && (
            <div className="alert">
              Total heures (travail + formation) : {totalHours} h. Attention, cela dépasse la limite de 1607 h.
            </div>
          )}
        </section>

        <section className="month-cards">
          {monthlyTables.map((days, monthIndex) => (
            <div key={monthIndex} className="month-card">
              <h3>{monthNames[monthIndex]}</h3>
              <div className="month-table-wrapper">
                <table className="month-calendar">
                  <thead>
                    <tr>
                      <th rowSpan="2" aria-label="Jour" title="Jour">J</th>
                      {days.map((day) => {
                        const headerClass = day.inVacation ? 'vacation-day-header' : '';
                        const dayInitial = ['D', 'L', 'M', 'Me', 'J', 'V', 'S'][new Date(`${day.date}T00:00:00Z`).getUTCDay()];
                        return (
                          <th key={`${day.date}-initial`} className={headerClass}>
                            {dayInitial}
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      {days.map((day) => {
                        const headerClass = day.inVacation ? 'vacation-day-header' : '';
                        return (
                          <th key={`${day.date}-number`} className={headerClass}>
                            {Number(day.date.slice(-2))}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th aria-label="Heures travail" title="Heures travail">T</th>
                      {days.map((day) => {
                        let cellClass = '';
                        if (day.inVacation) {
                          cellClass = getCalendarCellClass(day, day.isWeekend ? 'vacation-weekend-cell' : 'vacation-weekday-cell');
                        } else {
                          const dayOfWeek = new Date(day.date).getUTCDay();
                          cellClass = getCalendarCellClass(day, dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 3 ? 'normal-gray-cell' : 'normal-white-cell');
                        }
                        return (
                          <td key={`${day.date}-work`} className={cellClass}>
                            {day.effectiveHours ? day.effectiveHours.toFixed(2) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th aria-label="Formation" title="Formation">F</th>
                      {days.map((day) => {
                        let cellClass = '';
                        if (day.inVacation) {
                          cellClass = getCalendarCellClass(day, day.isWeekend ? 'vacation-weekend-cell' : 'vacation-weekday-cell');
                        } else {
                          const dayOfWeek = new Date(day.date).getUTCDay();
                          cellClass = getCalendarCellClass(day, dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 3 ? 'normal-gray-cell' : 'normal-white-cell');
                        }
                        return (
                          <td key={`${day.date}-training`} className={cellClass}>
                            {day.trainingHours ? day.trainingHours.toFixed(2) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th aria-label="Congés" title="Congés">C</th>
                      {days.map((day) => {
                        let cellClass = '';
                        if (day.inVacation) {
                          cellClass = getCalendarCellClass(day, day.isWeekend ? 'vacation-weekend-cell' : 'vacation-weekday-cell');
                        } else {
                          const dayOfWeek = new Date(day.date).getUTCDay();
                          cellClass = getCalendarCellClass(day, dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 3 ? 'normal-gray-cell' : 'normal-white-cell');
                        }
                        return (
                          <td key={`${day.date}-leave`} className={cellClass}>
                            {day.isCp ? 'CP' : day.isRtt ? 'RTT' : ''}
                          </td>
                        );
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
            <thead>
              <tr>
                <th>Mois</th>
                <th>Heures de travail</th>
                <th>Heures de formation</th>
                <th>CP</th>
                <th>RTT</th>
                <th>Jours de vacances</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummaries.map((summary) => (
                <tr key={summary.monthName}>
                  <td>{summary.monthName}</td>
                  <td>{summary.workHours.toFixed(2)}</td>
                  <td>{summary.trainingHours.toFixed(2)}</td>
                  <td>{summary.cpDays}</td>
                  <td>{summary.rttDays}</td>
                  <td>{summary.vacationDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default App;
