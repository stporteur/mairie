export type ForecastMode = 'details' | 'comparison';

const OPTIONS: ReadonlyArray<{ mode: ForecastMode; label: string }> = [
  { mode: 'details', label: 'Détails' },
  { mode: 'comparison', label: 'Comparatif' },
];

interface ForecastModeSelectorProps {
  mode: ForecastMode;
  onChange: (mode: ForecastMode) => void;
}

function ForecastModeSelector({ mode, onChange }: ForecastModeSelectorProps) {
  return (
    <section className="card forecast-mode-card">
      <fieldset className="leave-profile-options" aria-label="Mode d’affichage du prévisionnel">
        {OPTIONS.map((option) => (
          <label key={option.mode} className="leave-profile-option">
            <input type="radio" name="forecast-mode" value={option.mode} checked={mode === option.mode} onChange={() => onChange(option.mode)} />
            <span><strong>{option.label}</strong></span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}

export default ForecastModeSelector;
