import AddIcon from '@mui/icons-material/Add';
import { Link, useNavigate } from 'react-router-dom';
import { NEW_PARAMETER_PATH, parameterPath } from '@/config/routes';
import { useParametersList } from '@/hooks/useParametersList';
import Alert from '../common/Alert';

function ParametersListPage() {
  const { parameters, planningTypes, status, error } = useParametersList();
  const navigate = useNavigate();
  const typeName = (id: number | null) => planningTypes.find((type) => type.id === id)?.name ?? '—';

  return (
    <section className="card parameters-card">
      <div className="parameters-toolbar">
        <h2>Liste des paramètres</h2>
        <Link className="primary-button" to={NEW_PARAMETER_PATH}><AddIcon /> Nouveau paramètre</Link>
      </div>
      {status === 'loading' ? <p className="help-text">Chargement…</p> : null}
      {status === 'error' ? <Alert role="alert">{error}</Alert> : null}
      {status === 'ready' ? (
        <div className="planning-table">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Jours de CP</th>
                <th>Jours de RTT</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((parameter) => (
                <tr key={parameter.id} className="clickable-row" onClick={() => navigate(parameterPath(parameter.id))}>
                  <td><Link to={parameterPath(parameter.id)}>{parameter.name}</Link></td>
                  <td>{typeName(parameter.planningTypeId)}</td>
                  <td>{parameter.holidays ?? '—'}</td>
                  <td>{parameter.rtt ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parameters.length === 0 ? <p className="help-text">Aucun paramètre pour le moment.</p> : null}
        </div>
      ) : null}
    </section>
  );
}

export default ParametersListPage;
