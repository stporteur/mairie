import { useEffect, useState } from 'react';
import { FORECAST_MAX_YEAR_COUNT } from '@/config/constants';
import { maxSupportedYear, minSupportedYear } from '@/config/years';

export type ForecastMode = 'details' | 'comparison';

const OPTIONS: ReadonlyArray<{ mode: ForecastMode; label: string }> = [
  { mode: 'details', label: 'Détails' },
  { mode: 'comparison', label: 'Comparatif' },
];

interface ForecastModeSelectorProps {
  mode: ForecastMode;
  onChange: (mode: ForecastMode) => void;
  startYear: number;
  yearCount: number;
  onStartYearChange: (year: number) => void;
  onYearCountChange: (count: number) => void;
  disabled?: boolean;
}

interface BoundedNumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}

/** Keeps the raw text while typing; the value is only committed on blur or Enter. */
function BoundedNumberField({ label, value, min, max, disabled, onCommit }: BoundedNumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft((current) => (Number(current) === value ? current : String(value)));
  }, [value]);
  const parsed = Number(draft);
  const valid = draft.trim() !== '' && Number.isInteger(parsed) && parsed >= min && parsed <= max;

  const commit = (): void => {
    if (!valid) {
      setDraft(String(value));
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  return (
    <label className="leave-profile-option">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        disabled={disabled}
        aria-invalid={!valid}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
      />
    </label>
  );
}

function ForecastModeSelector({ mode, onChange, startYear, yearCount, onStartYearChange, onYearCountChange, disabled = false }: ForecastModeSelectorProps) {
  return (
    <section className="card forecast-mode-card">
      <fieldset className="leave-profile-options" aria-label="Mode d’affichage du prévisionnel">
        {OPTIONS.map((option) => (
          <label key={option.mode} className="leave-profile-option">
            <input type="radio" name="forecast-mode" value={option.mode} checked={mode === option.mode} onChange={() => onChange(option.mode)} />
            <span><strong>{option.label}</strong></span>
          </label>
        ))}
        <BoundedNumberField label="Année de départ" value={startYear}         min={minSupportedYear()} max={maxSupportedYear()} disabled={disabled} onCommit={onStartYearChange} />
                <BoundedNumberField label="Années de projection" value={yearCount} min={1} max={Math.min(FORECAST_MAX_YEAR_COUNT, maxSupportedYear() - startYear + 1)} disabled={disabled} onCommit={onYearCountChange} />
      </fieldset>
    </section>
  );
}

export default ForecastModeSelector;
