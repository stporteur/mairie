import type { VacationPeriod, VacationSource } from '@shared/types/vacations';
import { describeVacationSource } from '@/presentation/vacationSource';

interface VacationCardProps {
  year: number;
  vacations: VacationPeriod[];
  source: VacationSource | null;
  onVacationChange: (index: number, field: 'start' | 'end', value: string) => void;
}

function VacationSourceText({ source }: { source: VacationSource }) {
  const label = describeVacationSource(source);
  return (
    <p className="vacation-source">
      Source : {label.kind === 'link'
        ? <a href={label.url} target="_blank" rel="noreferrer">{label.text}</a>
        : label.kind === 'text' ? <span>{label.text}</span> : label.text}
    </p>
  );
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`));
}

function VacationCard({ year, vacations, source, onVacationChange }: VacationCardProps) {
  return (
    <details className="card collapsible-card">
      <summary><h2>Vacances scolaires</h2></summary>
      {vacations.length > 0 ? (
        <div className="vacation-display">
          <p>Vacances scolaires zone C pour {year}:</p>
          <ul className="vacation-list">
            {vacations.map((period, index) => (
              <li key={index} className={`vacation-item ${period.estimated ? 'estimated-vacation' : ''}`}>
                <strong>{period.name}</strong>
                {period.estimated ? (
                  <>
                    <input type="date" value={period.start} onChange={(event) => onVacationChange(index, 'start', event.target.value)} />
                    <span>au</span>
                    <input type="date" value={period.end} onChange={(event) => onVacationChange(index, 'end', event.target.value)} />
                  </>
                ) : (
                  <span className="vacation-dates">du {formatDate(period.start)} au {formatDate(period.end)}</span>
                )}
              </li>
            ))}
          </ul>
          {source ? <VacationSourceText source={source} /> : null}
        </div>
      ) : (
        <p className="alert">Vacances scolaires non disponibles pour {year}</p>
      )}
    </details>
  );
}

export default VacationCard;