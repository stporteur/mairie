import type { VacationPeriod, VacationSource } from '@shared/types/vacations';
import { describeVacationSource } from '@/presentation/vacationSource';

interface VacationCardProps {
  year: number;
  vacations: VacationPeriod[];
  source: VacationSource | null;
  onYearChange: (value: string) => void;
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

function VacationCard({ year, vacations, source, onYearChange, onVacationChange }: VacationCardProps) {
  return (
    <div className="card">
      <h2>Vacances scolaires</h2>
      <div className="field-row">
        <label>
          Année
          <input type="number" min="2020" max="2050" value={year} onChange={(event) => onYearChange(event.target.value)} />
        </label>
      </div>
      {vacations.length > 0 ? (
        <div className={`vacation-display ${source?.estimated ? 'estimated-vacation' : ''}`}>
          <p>Vacances scolaires zone C pour {year}:</p>
          <ul className="vacation-list">
            {vacations.map((period, index) => (
              <li key={index} className="vacation-item">
                <strong>{period.name}</strong>
                <input type="date" value={period.start} onChange={(event) => onVacationChange(index, 'start', event.target.value)} />
                <span>au</span>
                <input type="date" value={period.end} onChange={(event) => onVacationChange(index, 'end', event.target.value)} />
              </li>
            ))}
          </ul>
          {source ? <VacationSourceText source={source} /> : null}
        </div>
      ) : (
        <p className="alert">Vacances scolaires non disponibles pour {year}</p>
      )}
    </div>
  );
}

export default VacationCard;
