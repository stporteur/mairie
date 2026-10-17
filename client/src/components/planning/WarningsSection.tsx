import { ANNUAL_HOURS_LIMIT } from '@/config/constants';
import type { AnnualSummary, AnnualWarnings } from '@/domain/summary/annualSummary';
import Alert from '../common/Alert';

interface WarningsSectionProps {
  summary: AnnualSummary;
  warnings: AnnualWarnings;
  expectedLeave: number;
}

function WarningsSection({ summary, warnings, expectedLeave }: WarningsSectionProps) {
  return (
    <section className="warnings">
      {warnings.leaveMismatch ? (
        <Alert>Total des congés posés : {summary.totalLeave} jours. Le total attendu selon vos réglages est de {expectedLeave} jours.</Alert>
      ) : null}
      {warnings.hoursExceeded ? (
        <Alert>Total heures (travail + formation) : {summary.totalHours} h. Attention, cela dépasse la limite de {ANNUAL_HOURS_LIMIT} h.</Alert>
      ) : null}
    </section>
  );
}

export default WarningsSection;
