import { useCallback, useMemo, useState, useEffect } from 'react';
import { monthNames, VACATION_KEYWORDS, getDefaultVacationRanges } from './utils/constants';
import { formatIso, parseIso, getPentecostMonday } from './utils/date';
import { buildVacationsFromRanges, createHolidaySet, findVacationPeriods } from './services/vacations';
import { buildYearCalendar, getCalendarCellClass } from './services/calendar';
import { allocateLeave } from './services/leave';
import { allocateTraining } from './services/training';
import { fetchSchoolVacations, adjustVacationDates } from './services/api';
import VacationDisplay from './components/VacationDisplay';

interface VacationPeriod {
  name: string;
  start: string;
  end: string;
  estimated?: boolean;
}

interface VacationSource {
  local?: boolean;
  estimated?: boolean;
  dataset?: string;
  resource?: {
    id?: string;
    title?: string;
    url?: string;
  };
}

function App() {
  const [year, setYear] = useState<number>(2026);
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [vacationSource, setVacationSource] = useState<VacationSource | null>(null);
  const [loadingVacations, setLoadingVacations] = useState<boolean>(false);
  const [trainingByMonth, setTrainingByMonth] = useState<number[]>(Array.from({ length: 12 }, () => 0));
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const handleVacationsLoaded = useCallback((vacations: VacationPeriod[]) => {
    setVacations(vacations);
  }, []);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setLoadingVacations(loading);
  }, []);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  const calendarInfo = useMemo(() => {
    if (!vacations.length) {
      return null;
    }
    const calendar = buildYearCalendar(year, vacations);
    return allocateLeave(calendar, vacations);
  }, [year, vacations]);

  const totalTrainingHours = trainingByMonth.reduce((total, value) => total + Number(value || 0), 0);
  const totalWorkHours = calendarInfo
    ? calendarInfo.calendar.reduce((total, day) => total + day.effectiveHours, 0)
    : 0;
  const totalHours = Number((totalWorkHours + totalTrainingHours).toFixed(2));
  const cpCount = calendarInfo ? calendarInfo.cpDates.size : 0;
  const rttCount = calendarInfo ? calendarInfo.rttDates.size : 0;
  const totalLeave = cpCount + rttCount;
  const totalOffWarning = totalLeave !== 34;
  const hoursWarning = totalHours > 1607;

  const calendarWithTraining = calendarInfo ? allocateTraining(calendarInfo.calendar, trainingByMonth) : [];

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

  const handleTrainingChange = (index: number, value: number) => {
    const next = [...trainingByMonth];
    next[index] = Number(value || 0);
    setTrainingByMonth(next);
  };


  const monthlyTables = monthNames.map((_, monthIndex) =>
    calendarWithTraining.filter((day) => day.month === monthIndex),
  );

  const normalizeDate = (value: string) => value.slice(0, 10);
  
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
          <VacationDisplay
            year={year}
            onVacationsLoaded={handleVacationsLoaded}
            onLoadingChange={handleLoadingChange}
            onYearChange={handleYearChange}
          />
          <div className="card">
            <h2>Heures de formation</h2>
            <div className="month-grid">
              {monthNames.map((month, index) => (
                <label key={month} className="month-input">
                  <span>{month}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={trainingByMonth[index]}
                    onChange={(event) => handleTrainingChange(index, Number(event.target.value))}
                  />
                </label>
              ))}
            </div>
          </div>

        </section>

        <section className="stats-grid">
          <article>
            <h2>{cpCount}</h2>
            <p>Jours de CP posés</p>
          </article>
          <article>
            <h2>{rttCount}</h2>
            <p>Jours de RTT posés</p>
          </article>
          <article>
            <h2>{totalLeave}</h2>
            <p>Congés totaux posés</p>
          </article>
          <article>
            <h2>{totalWorkHours.toFixed(2)}</h2>
            <p>Heures de travail calculées</p>
          </article>
          <article>
            <h2>{totalTrainingHours.toFixed(2)}</h2>
            <p>Heures de formation</p>
          </article>
          <article>
            <h2>{totalHours.toFixed(2)}</h2>
            <p>Total travail + formation</p>
          </article>
        </section>

        <section className="warnings">
          {totalOffWarning && (
            <div className="alert">
              Total des congés posés : {totalLeave} jours. Vérifiez que le total soit bien de 34 jours.
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
                      <th rowSpan="2">Jour</th>
                      {days.map((day) => {
                        const headerClass = day.inVacation
                          ? day.vacationEstimated
                            ? 'vacation-day-header estimated-vacation-day-header'
                            : 'vacation-day-header'
                          : '';
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
                        const headerClass = day.inVacation
                          ? day.vacationEstimated
                            ? 'vacation-day-header estimated-vacation-day-header'
                            : 'vacation-day-header'
                          : '';
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
                      <th>Heures travail</th>
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
                      <th>Congés</th>
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