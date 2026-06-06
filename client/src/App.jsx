import { useMemo, useState, useEffect } from 'react';
import { monthNames, VACATION_KEYWORDS, getDefaultVacationRanges } from './utils/constants';
import { formatIso, parseIso, getPentecostMonday } from './utils/date';
import { buildVacationsFromRanges, createHolidaySet, findVacationPeriods } from './services/vacations';
import { buildYearCalendar, getCalendarCellClass } from './services/calendar';
import { allocateLeave } from './services/leave';
import { allocateTraining } from './services/training';
import { fetchSchoolVacations, adjustVacationDates } from './services/api';

function App() {
  const [year, setYear] = useState(2026);
  const [vacations, setVacations] = useState([]);
  const [vacationSource, setVacationSource] = useState(null);
  const [loadingVacations, setLoadingVacations] = useState(false);
  const [trainingByMonth, setTrainingByMonth] = useState(Array.from({ length: 12 }, () => 0));
  const [sidebarOpen, setSidebarOpen] = useState(true);

    // Fetch school vacations from API
    useEffect(() => {
      const loadVacations = async () => {
        setLoadingVacations(true);
        try {
          const data = await fetchSchoolVacations(year);
          setVacationSource(data.source || null);
          if (data.vacations) {
            const filteredVacations = data.vacations.filter((vacation) =>
              vacation.name?.toLowerCase().includes('vacances')
            );
            const adjustedVacations = adjustVacationDates(filteredVacations, year);
            setVacations(adjustedVacations);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des vacances:', error);
          setVacations([]);
          setVacationSource(null);
        } finally {
          setLoadingVacations(false);
        }
      };

      loadVacations();
    }, [year]);

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

  const handleTrainingChange = (index, value) => {
    const next = [...trainingByMonth];
    next[index] = Number(value || 0);
    setTrainingByMonth(next);
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
            <h2>Vacances scolaires</h2>
            <div className="field-row">
              <label>
                Année
                <input
                  type="number"
                  min="2020"
                  max="2050"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value) || 2026)}
                />
              </label>
            </div>
            {loadingVacations ? (
              <p>Chargement des vacances scolaires...</p>
            ) : vacations.length > 0 ? (
              <div className="vacation-display">
                <p>Vacances scolaires zone C pour {year}:</p>
                <ul className="vacation-list">
                  {vacations.map((period, index) => (
                    <li key={index} className="vacation-item">
  <strong>{period.name}</strong>

  <input
    type="date"
    value={period.start}
    onChange={(e) => {
      const next = [...vacations];
      next[index] = { ...next[index], start: e.target.value.slice(0, 10), };
      setVacations(next);
    }}
  />

  <span>au</span>

  <input
    type="date"
    value={period.end}
    onChange={(e) => {
      const next = [...vacations];
      next[index] = { ...next[index], end: e.target.value };
      setVacations(next);
    }}
  />
</li>
                

                  ))}
                </ul>
                  {vacationSource ? (
                    <p className="vacation-source">
                      Source : {vacationSource.local ? (
                        'données locales'
                      ) : (
                        vacationSource.resource && vacationSource.resource.url ? (
                          <a href={vacationSource.resource.url} target="_blank" rel="noreferrer">{vacationSource.resource.title || vacationSource.resource.url}</a>
                        ) : (
                          <span>{vacationSource.dataset || 'source officielle'}</span>
                        )
                      )}
                    </p>
                  ) : null}
              </div>
            ) : (
              <p className="alert">Vacances scolaires non disponibles pour {year}</p>
            )}
          </div>

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
                    onChange={(event) => handleTrainingChange(index, event.target.value)}
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
                      <th>Formation</th>
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
