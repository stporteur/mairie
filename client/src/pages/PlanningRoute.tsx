import { useEffect } from 'react';
import PlanningPage from '@/components/planning/PlanningPage';
import { usePlanning } from '@/hooks/usePlanning';

function PlanningRoute() {
  const model = usePlanning();
  const { onResetProfile } = model;

  // Each visit starts without a selected profile.
  useEffect(() => {
    onResetProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <PlanningPage model={model} />;
}

export default PlanningRoute;
