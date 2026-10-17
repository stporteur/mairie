import PlanningPage from '@/components/planning/PlanningPage';
import { usePlanning } from '@/hooks/usePlanning';

function PlanningRoute() {
  return <PlanningPage model={usePlanning()} />;
}

export default PlanningRoute;
