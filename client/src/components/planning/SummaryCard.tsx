import type { AnnualSummary } from '@/domain/summary/annualSummary';

function SummaryCard({ summary }: { summary: AnnualSummary }) {
  return (
    <article className="summary-card">
      <h2 className="summary-title">Récapitulatif</h2>
      <div className="summary-items">
        <div className="summary-item"><h3>{summary.cpCount}</h3><p>Jours de CP posés</p></div>
        <div className="summary-item"><h3>{summary.rttCount}</h3><p>Jours de RTT posés</p></div>
        <div className="summary-item"><h3>{summary.totalLeave}</h3><p>Congés totaux posés</p></div>
        <div className="summary-item"><h3>{summary.totalWorkHours.toFixed(2)}</h3><p>Heures de travail calculées</p></div>
        <div className="summary-item"><h3>{summary.hoursDue.toFixed(2)}</h3><p>Heures dues</p></div>
      </div>
    </article>
  );
}

export default SummaryCard;
