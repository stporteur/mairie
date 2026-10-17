import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Link } from 'react-router-dom';
import { PARAMETERS_PATH } from '@/config/routes';
import { useParameterDetail } from '@/hooks/useParameterDetail';
import Alert from '../common/Alert';
import ParameterForm from './ParameterForm';

/** Remounted by the route (via `key`) whenever the displayed parameter changes. */
function ParameterDetailPage({ id }: { id: number | null }) {
  const model = useParameterDetail(id);

  return (
    <section className="card parameters-card">
      <div className="parameters-toolbar">
        <Link className="secondary-button" to={PARAMETERS_PATH}><ArrowBackIcon /> Retour à la liste</Link>
        <div className="parameters-actions">
          {model.editing ? (
            <>
              <button className="primary-button" type="button" disabled={model.saving} onClick={model.onSave}>Enregistrer</button>
              <button className="secondary-button" type="button" disabled={model.saving} onClick={model.onCancel}>Annuler</button>
              {model.isNew ? null : (
                <button className="danger-button" type="button" disabled={model.saving} onClick={model.onDelete}><DeleteIcon /> Supprimer</button>
              )}
            </>
          ) : (
            <button className="primary-button" type="button" disabled={model.status !== 'ready'} onClick={model.onEdit}><EditIcon /> Modifier</button>
          )}
        </div>
      </div>

      <h2>{model.isNew ? 'Nouveau paramètre' : (model.draft.name || 'Paramètre')}</h2>
      {model.status === 'loading' ? <p className="help-text">Chargement…</p> : null}
      {model.error ? <Alert role="alert">{model.error}</Alert> : null}
      {model.status === 'ready' ? (
        <ParameterForm
          draft={model.draft}
          planningTypes={model.planningTypes}
          section={model.section}
          readOnly={!model.editing}
          onFieldChange={model.onFieldChange}
          onSectionChange={model.onSectionChange}
        />
      ) : null}
    </section>
  );
}

export default ParameterDetailPage;
