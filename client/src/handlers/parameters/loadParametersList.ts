import type { ParameterProfile, PlanningTypeOption } from '@shared/types/parameters';
import type { LoadStatus } from '@/domain/parameters/types';
import type { ParametersGateway } from '@/ports/ParametersGateway';
import type { PlanningTypesGateway } from '@/ports/PlanningTypesGateway';
import type { StateSetter } from '../types';

export interface LoadParametersListDeps {
  parameters: ParametersGateway;
  planningTypes: PlanningTypesGateway;
  setParameters: StateSetter<ParameterProfile[]>;
  setPlanningTypes: StateSetter<PlanningTypeOption[]>;
  setStatus: StateSetter<LoadStatus>;
  setError: StateSetter<string>;
}

export function createLoadParametersList(deps: LoadParametersListDeps) {
  return async (isCancelled: () => boolean): Promise<void> => {
    try {
      const [parameters, planningTypes] = await Promise.all([
        deps.parameters.fetchParameters(),
        deps.planningTypes.fetchPlanningTypes(),
      ]);
      if (isCancelled()) return;
      deps.setParameters(parameters);
      deps.setPlanningTypes(planningTypes);
      deps.setStatus('ready');
    } catch (failure) {
      if (isCancelled()) return;
      deps.setError(failure instanceof Error ? failure.message : 'Impossible de charger les paramètres.');
      deps.setStatus('error');
    }
  };
}
