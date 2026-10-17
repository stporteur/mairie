import ForecastPage from '@/components/forecast/ForecastPage';
import { NO_PROFILE } from '@/domain/settings/types';
import { usePlanning } from '@/hooks/usePlanning';

function ForecastRoute() {
  const planning = usePlanning();
  return (
    <ForecastPage
      key={planning.year}
      startYear={planning.year}
      profiles={planning.profiles}
      initialSettings={planning.settings}
      initialProfile={NO_PROFILE}
    />
  );
}

export default ForecastRoute;
