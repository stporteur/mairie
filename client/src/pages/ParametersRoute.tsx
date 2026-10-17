import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import ParameterDetailPage from '@/components/parameters/ParameterDetailPage';
import ParametersListPage from '@/components/parameters/ParametersListPage';
import { PARAMETERS_PATH } from '@/config/routes';

function ParameterDetailRoute() {
  const { id } = useParams();
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) return <Navigate to={PARAMETERS_PATH} replace />;
  return <ParameterDetailPage key={parsed} id={parsed} />;
}

function ParametersRoute() {
  return (
    <Routes>
      <Route index element={<ParametersListPage />} />
      <Route path="new" element={<ParameterDetailPage key="new" id={null} />} />
      <Route path=":id" element={<ParameterDetailRoute />} />
    </Routes>
  );
}

export default ParametersRoute;
