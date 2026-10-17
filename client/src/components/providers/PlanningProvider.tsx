import type { ReactNode } from 'react';
import { PlanningContext } from '@/hooks/PlanningContext';
import { usePlanningPage } from '@/hooks/usePlanningPage';

function PlanningProvider({ children }: { children: ReactNode }) {
  return <PlanningContext.Provider value={usePlanningPage()}>{children}</PlanningContext.Provider>;
}

export default PlanningProvider;
