import type { ReactNode } from 'react';
import type { LeaveProfiles } from '@/domain/settings/types';
import { PlanningContext } from '@/hooks/PlanningContext';
import { useLeaveProfiles } from '@/hooks/useLeaveProfiles';
import { usePlanningPage } from '@/hooks/usePlanningPage';
import Alert from '../common/Alert';

function ReadyPlanningProvider({ profiles, children }: { profiles: LeaveProfiles; children: ReactNode }) {
  return <PlanningContext.Provider value={usePlanningPage(profiles)}>{children}</PlanningContext.Provider>;
}

/** Renders the pages once the leave profiles are loaded from the API. */
function PlanningProvider({ children }: { children: ReactNode }) {
  const state = useLeaveProfiles();
  if (state.status === 'loading') return <p>Chargement des paramètres…</p>;
  if (state.status === 'error') {
    return <Alert role="alert">Impossible de charger les paramètres : {state.message}</Alert>;
  }
  return <ReadyPlanningProvider profiles={state.profiles}>{children}</ReadyPlanningProvider>;
}

export default PlanningProvider;
