import type { ForecastSummaryRow } from '@shared/types/forecast';

interface ForecastTableProps {
  startYear: number;
  yearCount: number;
  rows: ForecastSummaryRow[];
}

function ForecastTable({ startYear, yearCount, rows }: ForecastTableProps) {
  return (
    <section className="planning-table forecast-table-section">
      <h2>Prévisionnel {startYear}–{startYear + yearCount - 1}</h2>
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
  );
}

export default ForecastTable;
