import { useMemo, useState, useEffect } from 'react';
import getJoursFeries from 'jours-feries-fr';

const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function getDefaultVacationRanges(year) {
  return {
    noelDebutStart: `${year}-01-01`, 
    noelDebutEnd: `${year}-01-05`,
    hiverStart: `${year}-02-12`,
    hiverEnd: `${year}-02-28`,
    printempsStart: `${year}-04-16`,
    printempsEnd: `${year}-05-02`,
    eteStart: `${year}-07-06`,
    eteEnd: `${year}-08-31`,
    toussaintStart: `${year}-10-23`,
    toussaintEnd: `${year}-11-07`,
    noelFinStart: `${year}-12-20`,
    noelFinEnd: `${year}-12-31`,
  };
}

const smallVacationKeywords = ['noël', 'noel', 'hiver', 'printemps', 'toussaint'];
const summerVacationKeywords = ['été', 'ete', 'grandes vacances', "vacances d'été", 'vacances ete'];

function formatIso(date) {
  return date.toISOString().slice(0, 10);
}

function parseIso(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error('Date invalide : ' + dateString);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function buildVacationsFromRanges(ranges) {
  const periodDefinitions = [
    { name: 'Noël début d\'année', start: ranges.noelDebutStart, end: ranges.noelDebutEnd },
    { name: 'Vacances d\'hiver', start: ranges.hiverStart, end: ranges.hiverEnd },
    { name: 'Vacances de printemps', start: ranges.printempsStart, end: ranges.printempsEnd },
    { name: 'Grandes vacances', start: ranges.eteStart, end: ranges.eteEnd },
    { name: 'Toussaint', start: ranges.toussaintStart, end: ranges.toussaintEnd },
    { name: 'Noël fin d\'année', start: ranges.noelFinStart, end: ranges.noelFinEnd },
  ];

  return periodDefinitions.map((item) => {
    if (!item.start || !item.end) {
      throw new Error(`La période ${item.name} doit avoir des dates de début et de fin.`);
    }
    const start = formatIso(parseIso(item.start));
    const end = formatIso(parseIso(item.end));
    if (start > end) {
      throw new Error(`La date de début doit précéder la date de fin pour ${item.name}.`);
    }
    return {
      name: item.name,
      start,
      end,
    };
  });
}

function createHolidaySet(year) {
  const holidays = getJoursFeries(year, 'YYYY-MM-DD');
  return holidays instanceof Set ? holidays : new Set(holidays);
}

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month, day));
}

function getPentecostMonday(year) {
  const easter = getEasterSunday(year);
  const pentecostMonday = new Date(easter);
  pentecostMonday.setUTCDate(pentecostMonday.getUTCDate() + 50);
  return formatIso(pentecostMonday);
}

function buildYearCalendar(year, vacations) {
  const holidaySet = createHolidaySet(year);
  const calendar = [];
  const firstDay = new Date(Date.UTC(year, 0, 1));
  const lastDay = new Date(Date.UTC(year, 11, 31));

  for (let date = new Date(firstDay); date <= lastDay; date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = formatIso(date);
    const day = date.getUTCDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidaySet.has(iso);
    const inVacation = vacations.some((vacation) => iso >= vacation.start && iso <= vacation.end);
    const isWednesdayRest = day === 3 && !inVacation;
    const isWorkday = !isWeekend && !isHoliday && !isWednesdayRest;
    const defaultHours = isWorkday ? (inVacation ? 7 : 9.25) : 0;

    calendar.push({
      date: iso,
      month: date.getUTCMonth(),
      isWeekend,
      isHoliday,
      inVacation,
      isWednesdayRest,
      isWorkday,
      defaultHours,
      vacationName: vacations.find((vacation) => iso >= vacation.start && iso <= vacation.end)?.name || null,
      isCp: false,
      isRtt: false,
    });
  }

  return calendar;
}

function findVacationPeriods(vacations, keywords) {
  return vacations.filter((vacation) =>
    keywords.some((keyword) => vacation.name.toLowerCase().includes(keyword)),
  );
}

function allocateLeave(calendar, vacations) {
  const cpDates = new Set();
  const rttDates = new Set();

  function allocateDays(periods, count) {
    const allocations = [];
    periods.forEach((period) => {
      const candidates = calendar.filter(
        (day) =>
          day.month !== 0 &&
          day.date >= period.start &&
          day.date <= period.end &&
          day.isWorkday &&
          !cpDates.has(day.date) &&
          !rttDates.has(day.date),
      );
      for (let i = 0; i < Math.min(count, candidates.length); i += 1) {
        allocations.push(candidates[i].date);
      }
    });
    return allocations;
  }

  const smallVacations = findVacationPeriods(vacations, smallVacationKeywords);
  const summerVacations = findVacationPeriods(vacations, summerVacationKeywords);

  const smallAllocation = allocateDays(smallVacations, 5);
  smallAllocation.forEach((date) => cpDates.add(date));

  const summerAllocation = allocateDays(summerVacations, 5);
  summerAllocation.forEach((date) => cpDates.add(date));

  const year = calendar.length ? Number(calendar[0].date.slice(0, 4)) : null;
  if (year) {
    const pentecostMondayDate = getPentecostMonday(year);
    if (pentecostMondayDate && !cpDates.has(pentecostMondayDate)) {
      rttDates.add(pentecostMondayDate);
    }
  }

  const summerVacationDates = new Set(
    calendar
      .filter((day) =>
        summerVacations.some(
          (period) => day.date >= period.start && day.date <= period.end,
        ),
      )
      .map((day) => day.date),
  );

  const summerCpDates = new Set(
    calendar
      .filter(
        (day) =>
          cpDates.has(day.date) &&
          summerVacationDates.has(day.date),
      )
      .map((day) => day.date),
  );

  const remainingRttCandidates = calendar
    .filter(
      (day) =>
        day.inVacation &&
        day.isWorkday &&
        !cpDates.has(day.date) &&
        !rttDates.has(day.date),
    )
    .map((day) => {
      const minDistanceToSummerCp = [...summerCpDates].reduce((min, cpDate) => {
        const distance = Math.abs(
          new Date(day.date).getTime() - new Date(cpDate).getTime(),
        );
        return Math.min(min, distance);
      }, Infinity);
      return {
        day,
        priority:
          summerVacationDates.has(day.date) && summerCpDates.size > 0
            ? minDistanceToSummerCp
            : Infinity,
      };
    })
    .sort((a, b) => a.priority - b.priority)
    .map((entry) => entry.day);

  const remainingRttCount = 9 - rttDates.size;
  remainingRttCandidates.slice(0, remainingRttCount).forEach((day) => rttDates.add(day.date));

  const remainingCpCount = 25 - cpDates.size;
  if (remainingCpCount > 0) {
    const extraCandidates = calendar.filter(
      (day) =>
        day.inVacation &&
        day.isWorkday &&
        !cpDates.has(day.date) &&
        !rttDates.has(day.date),
    );
    extraCandidates.slice(0, remainingCpCount).forEach((day) => cpDates.add(day.date));
  }

  const allDates = calendar.map((day) => ({
    ...day,
    isCp: cpDates.has(day.date),
    isRtt: rttDates.has(day.date),
    effectiveHours: cpDates.has(day.date) || rttDates.has(day.date) ? 0 : day.defaultHours,
  }));

  return {
    calendar: allDates,
    cpDates,
    rttDates,
  };
}

function allocateTraining(calendar, trainingByMonth) {
  const enriched = calendar.map((day) => ({ ...day, trainingHours: 0 }));

  monthNames.forEach((_, monthIndex) => {
    const total = Number(trainingByMonth[monthIndex] || 0);
    const workdays = enriched.filter(
      (day) => day.month === monthIndex && day.isWorkday && !day.isCp && !day.isRtt,
    );
    if (!workdays.length || total <= 0) {
      return;
    }

    const perDay = Number((total / workdays.length).toFixed(2));
    let assigned = 0;

    workdays.forEach((day, index) => {
      if (index === workdays.length - 1) {
        day.trainingHours = Number((total - assigned).toFixed(2));
      } else {
        day.trainingHours = perDay;
        assigned += perDay;
      }
    });
  });

  return enriched;
}

function getCalendarCellClass(day, defaultClass) {
  if (day.isWednesdayRest) {
    return 'wednesday-rest-cell';
  }
  if (day.isWeekend || day.isHoliday) {
    return 'offday-cell';
  }
  return defaultClass;
}

function App() {
  const [year, setYear] = useState(2026);
  const [vacations, setVacations] = useState([]);
  const [vacationSource, setVacationSource] = useState(null);
  const [loadingVacations, setLoadingVacations] = useState(false);
  const [trainingByMonth, setTrainingByMonth] = useState(Array.from({ length: 12 }, () => 0));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Récupérer les vacances scolaires depuis l'API
  useEffect(() => {
    setLoadingVacations(true);
    fetch(`/api/vacations/${year}`)
      .then(res => res.json())
      .then(data => {
        setVacationSource(data.source || null);
        if (data.vacations) {
          const filteredVacations = data.vacations.filter((vacation) =>
    vacation.name?.toLowerCase().includes('vacances')
  );
          // Ajuster les dates : vacances commencent un samedi et se terminent un dimanche
          const adjustedVacations = filteredVacations.map((vacation) => {
            const startDate = new Date(vacation.start + 'T00:00:00Z');
            const endDate = new Date(vacation.end + 'T00:00:00Z');

            // Pour Noël en décembre, on garde toujours jusqu'au 31 décembre
            const isNoelDecember = /no[eën]l/i.test(vacation.name) && 
                                   startDate.getUTCMonth() === 11;

            let adjustedStart = new Date(startDate);
            let adjustedEnd = new Date(endDate);

            if (!isNoelDecember) {
              // Trouver le samedi avant ou égal à la date de début
              const dayOfWeekStart = startDate.getUTCDay();
              const daysBackToSaturday =
                dayOfWeekStart === 6 ? 0 : ((dayOfWeekStart + 1) % 7);

              adjustedStart.setUTCDate(
                adjustedStart.getUTCDate() - daysBackToSaturday
              );
            } else {
              // Pour Noël en décembre, toujours jusqu'au 31 décembre
              adjustedEnd.setUTCFullYear(year, 11, 31);
            }

            return {
              name: vacation.name,
              start: formatIso(adjustedStart),
              end: formatIso(adjustedEnd),
            };
          });
          setVacations(adjustedVacations);
        }
        setLoadingVacations(false);
      })
      .catch(error => {
        console.error('Erreur lors du chargement des vacances:', error);
        setVacations([]);
          setVacationSource(null);
        setLoadingVacations(false);
      });
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
