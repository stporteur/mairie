import type { MonthlySummary } from '@/domain/summary/monthlySummary';

function MonthlySummaryTable({ summaries }: { summaries: MonthlySummary[] }) {
  return (
    <section className="planning-table">
      <h2>Récapitulatif par mois</h2>
      <table>
        <thead><tr><th>Mois</th><th>Heures de travail</th><th>CP</th><th>RTT</th><th>Jours de vacances</th></tr></thead>
        <tbody>
          {summaries.map((summary) => (
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
  );
}

export default MonthlySummaryTable;
