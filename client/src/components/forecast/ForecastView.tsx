import { FORECAST_YEAR_COUNT } from '@/config/constants';
import type { ForecastPageModel } from '@/hooks/useForecastPage';
import Alert from '../common/Alert';
import ExportBar from '../common/ExportBar';
import LeaveProfileSelector from '../common/LeaveProfileSelector';
import LeaveSettingsFields from '../common/LeaveSettingsFields';
import ForecastTable from './ForecastTable';

function ForecastView({ model }: { model: ForecastPageModel }) {
  const { startYear } = model;

  return (
    <>
      <section className="config-panel forecast-config-panel">
        <div className="card">
          <h2>Paramètres</h2>
          <LeaveProfileSelector
            name="forecast-leave-profile"
            ariaLabel="Profils horaires prévisionnel"
            selected={model.profile}
            onChange={model.onProfileChange}
          />
          <LeaveSettingsFields settings={model.settings} onChange={model.onSettingChange} />
          <p className="help-text">Années calculées : {startYear}–{startYear + FORECAST_YEAR_COUNT - 1}. Les paramètres s’appliquent au prévisionnel après « Calculer ».</p>
          {model.error ? <Alert role="alert">{model.error}</Alert> : null}
          {model.progress ? <p className="help-text" role="status">{model.progress}</p> : null}
          <button className="primary-button calculate-button" type="button" onClick={model.onCalculate} disabled={model.calculating}>
            {model.calculating ? 'Calcul en cours…' : 'Calculer'}
          </button>
        </div>
      </section>

      {model.rows.length > 0 ? (
        <>
          <ForecastTable startYear={startYear} yearCount={FORECAST_YEAR_COUNT} rows={model.rows} />
          <ExportBar error="" exporting={model.exporting} disabled={model.exporting} label="Export Excel" onExport={model.onExport} />
        </>
      ) : null}
    </>
  );
}

export default ForecastView;
