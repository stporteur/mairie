import { FORECAST_YEAR_COUNT } from '@/config/constants';
import { CUSTOM_PROFILE } from '@/domain/settings/types';
import type { ForecastPageModel } from '@/hooks/useForecastPage';
import Alert from '../common/Alert';
import ExportBar from '../common/ExportBar';
import LeaveSettingsPanel from '../common/LeaveSettingsPanel';
import ForecastTable from './ForecastTable';

function ForecastDetails({ model }: { model: ForecastPageModel }) {
  const { startYear } = model;

  return (
    <>
      <section className="config-panel forecast-config-panel">
        <LeaveSettingsPanel
          profileGroupName="forecast-leave-profile"
          profileAriaLabel="Profils horaires prévisionnel"
          settings={model.settings}
          profile={model.profile}
          profiles={model.profiles}
          onProfileChange={model.onProfileChange}
          onSettingChange={model.onSettingChange}
        >
          <p className="help-text">Années calculées : {startYear}–{startYear + FORECAST_YEAR_COUNT - 1}. {model.profile === CUSTOM_PROFILE ? 'Les paramètres personnalisés s’appliquent après « Calculer ».' : 'Le choix d’un profil lance le calcul.'}</p>
          {model.error ? <Alert role="alert">{model.error}</Alert> : null}
          {model.progress ? <p className="help-text" role="status">{model.progress}</p> : null}
          {model.profile === CUSTOM_PROFILE ? (
            <button className="primary-button calculate-button" type="button" onClick={model.onCalculate} disabled={model.calculating}>
              {model.calculating ? 'Calcul en cours…' : 'Calculer'}
            </button>
          ) : null}
        </LeaveSettingsPanel>
      </section>

      {model.rows.length > 0 ? (
        <>
          <ForecastTable startYear={startYear} yearCount={FORECAST_YEAR_COUNT} rows={model.rows} />
          <ExportBar error="" exporting={model.exporting} disabled={model.exporting} label="Export Excel" onExport={model.onExport} secondary={{ label: 'Export PDF', onClick: model.onExportPdf }} />
        </>
      ) : null}
    </>
  );
}

export default ForecastDetails;
