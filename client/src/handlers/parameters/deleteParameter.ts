import type { ParametersGateway } from '@/ports/ParametersGateway';
import type { StateSetter } from '../types';

export interface DeleteParameterDeps {
  id: number | null;
  saving: boolean;
  parameters: ParametersGateway;
  setSaving: StateSetter<boolean>;
  setError: StateSetter<string>;
  /** Asks the user to confirm the irreversible deletion. */
  confirm: () => boolean;
  onDeleted: () => void;
}

export function createDeleteParameter(deps: DeleteParameterDeps) {
  return async (): Promise<void> => {
    if (deps.id === null || deps.saving || !deps.confirm()) return;
    deps.setSaving(true);
    deps.setError('');
    try {
      await deps.parameters.deleteParameter(deps.id);
      deps.onDeleted();
    } catch (failure) {
      deps.setError(failure instanceof Error ? failure.message : 'Impossible de supprimer le paramètre.');
      deps.setSaving(false);
    }
  };
}
