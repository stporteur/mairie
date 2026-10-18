import { FORECAST_YEAR_COUNT } from '@/config/constants';
import type { ForecastComparisonModel } from '@/hooks/useForecastComparison';
import Alert from '../common/Alert';
import ExportBar from '../common/ExportBar';
import ForecastComparisonTable from './ForecastComparisonTable';
import ForecastProfileCheckboxes from './ForecastProfileCheckboxes';

function ForecastComparison({ model }: { model: ForecastComparisonModel }) {
  const { startYear, profiles, selected, results } = model;
  const columns = profiles
    .filter((profile) => selected.includes(profile.key) && results[profile.key])
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));

  return (
    <>
      <section className="card">
        <h2>Profils à comparer</h2>
        <ForecastProfileCheckboxes
          profiles={profiles}
          cpDays={model.cpDays}
          selected={selected}
          onToggle={model.onToggleProfile}
        />
        <p className="help-text">Années calculées : {startYear}–{startYear + FORECAST_YEAR_COUNT - 1}.</p>
        {model.error ? <Alert role="alert">{model.error}</Alert> : null}
        {model.loading ? <p className="help-text" role="status">Calcul en cours…</p> : null}
      </section>

      {columns.length > 0 ? (
        <>
          <ForecastComparisonTable
            startYear={startYear}
            yearCount={FORECAST_YEAR_COUNT}
            cpDays={model.cpDays}
            profiles={columns}
            results={results}
          />
          <ExportBar error="" exporting={model.exporting} disabled={model.exporting || !model.canExport} label="Export Excel" onExport={model.onExport} secondary={{ label: 'Export PDF', onClick: model.onExportPdf }} />
        </>
      ) : null}
    </>
  );
}

export default ForecastComparison;
