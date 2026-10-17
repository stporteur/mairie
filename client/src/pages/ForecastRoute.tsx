import ForecastPage from '@/components/forecast/ForecastPage';
import { usePlanning } from '@/hooks/usePlanning';

function ForecastRoute() {
  const planning = usePlanning();
  return (
    <ForecastPage
      key={`${planning.year}-${planning.profile}`}
      startYear={planning.year}
      profiles={planning.profiles}
      initialSettings={planning.settings}
      initialProfile={planning.profile}
    />
  );
}

export default ForecastRoute;
