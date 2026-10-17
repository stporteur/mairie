import type { ParameterProfile, PlanningTypeOption } from '@shared/types/parameters';
import { toDraft } from '@/domain/parameters/draft';
import type { LoadStatus, ParameterDraft } from '@/domain/parameters/types';
import type { ParametersGateway } from '@/ports/ParametersGateway';
import type { PlanningTypesGateway } from '@/ports/PlanningTypesGateway';
import type { StateSetter } from '../types';

export interface LoadParameterDetailDeps {
  /** Null when creating a new parameter: only the planning types are needed. */
  id: number | null;
  parameters: ParametersGateway;
  planningTypes: PlanningTypesGateway;
  setPlanningTypes: StateSetter<PlanningTypeOption[]>;
  setProfile: StateSetter<ParameterProfile | null>;
  setDraft: StateSetter<ParameterDraft>;
  setStatus: StateSetter<LoadStatus>;
  setError: StateSetter<string>;
}

export function createLoadParameterDetail(deps: LoadParameterDetailDeps) {
  return async (isCancelled: () => boolean): Promise<void> => {
    try {
      const [planningTypes, profile] = await Promise.all([
        deps.planningTypes.fetchPlanningTypes(),
        deps.id === null ? Promise.resolve(null) : deps.parameters.fetchParameter(deps.id),
      ]);
      if (isCancelled()) return;
      deps.setPlanningTypes(planningTypes);
      if (profile) {
        deps.setProfile(profile);
        deps.setDraft(toDraft(profile));
      }
      deps.setStatus('ready');
    } catch (failure) {
      if (isCancelled()) return;
      deps.setError(failure instanceof Error ? failure.message : 'Impossible de charger le paramètre.');
      deps.setStatus('error');
    }
  };
}
