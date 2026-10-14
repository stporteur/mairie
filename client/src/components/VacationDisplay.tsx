import { useState, useEffect } from 'react';
import { fetchSchoolVacations, adjustVacationDates } from '../services/api';
import { formatIso } from '../utils/date';

interface VacationPeriod {
  name: string;
  start: string;
  end: string;
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

interface VacationDisplayProps {
  year: number;
  onVacationsLoaded: (vacations: VacationPeriod[]) => void;
  onLoadingChange: (loading: boolean) => void;
  onYearChange: (year: number) => void;
}

function VacationDisplay({ year, onVacationsLoaded, onLoadingChange, onYearChange }: VacationDisplayProps) {
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [vacationSource, setVacationSource] = useState<VacationSource | null>(null);

  useEffect(() => {
    const loadVacations = async () => {
      onLoadingChange(true);
      try {
        const data = await fetchSchoolVacations(year);
        setVacationSource(data.source || null);
        if (data.vacations) {
          const filteredVacations = data.vacations.filter((vacation) =>
            vacation.name?.toLowerCase().includes('vacances')
          );
          const adjustedVacations = adjustVacationDates(filteredVacations, year);
          setVacations(adjustedVacations);
          onVacationsLoaded(adjustedVacations);
        } else {
          onVacationsLoaded([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des vacances:', error);
        setVacations([]);
        setVacationSource(null);
        onVacationsLoaded([]);
      } finally {
        onLoadingChange(false);
      }
    };

    loadVacations();
  }, [year, onVacationsLoaded, onLoadingChange]);

  const handleVacationChange = (index: number, field: string, value: string) => {
    const next = [...vacations];
    next[index] = { ...next[index], [field]: value };
    setVacations(next);
    onVacationsLoaded(next);
  };

  return (
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
            onChange={(event) => onYearChange(Number(event.target.value) || 2026)}
          />
        </label>
      </div>
      {vacations.length > 0 ? (
        <div className="vacation-display">
          <p>Vacances scolaires zone C pour {year}:</p>
          <ul className="vacation-list">
            {vacations.map((period, index) => (
              <li key={index} className="vacation-item">
                <strong>{period.name}</strong>
                <input
                  type="date"
                  value={period.start}
                  onChange={(e) => handleVacationChange(index, 'start', e.target.value.slice(0, 10))}
                />
                <span>au</span>
                <input
                  type="date"
                  value={period.end}
                  onChange={(e) => handleVacationChange(index, 'end', e.target.value)}
                />
              </li>
            ))}
          </ul>
          {vacationSource ? (
            <p className="vacation-source">
              Source : {vacationSource.estimated ? (
                'dates estimées — à vérifier'
              ) : vacationSource.local ? (
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
  );
}

export default VacationDisplay;