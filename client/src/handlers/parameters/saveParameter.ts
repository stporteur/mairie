import type { ParameterProfile, PlanningTypeOption } from '@shared/types/parameters';
import { toDraft, toInput } from '@/domain/parameters/draft';
import type { ParameterDraft } from '@/domain/parameters/types';
import { validateParameterDraft } from '@/domain/parameters/validate';
import type { ParametersGateway } from '@/ports/ParametersGateway';
import type { StateSetter } from '../types';

export interface SaveParameterDeps {
  /** Null when creating a new parameter. */
  id: number | null;
  draft: ParameterDraft;
  planningTypes: PlanningTypeOption[];
  saving: boolean;
  parameters: ParametersGateway;
  setProfile: StateSetter<ParameterProfile | null>;
  setDraft: StateSetter<ParameterDraft>;
  setEditing: StateSetter<boolean>;
  setSaving: StateSetter<boolean>;
  setError: StateSetter<string>;
  onCreated: (id: number) => void;
}

export function createSaveParameter(deps: SaveParameterDeps) {
  return async (): Promise<void> => {
    if (deps.saving) return;
    const validationError = validateParameterDraft(deps.draft, deps.planningTypes);
    if (validationError) {
      deps.setError(validationError);
      return;
    }

    deps.setSaving(true);
    deps.setError('');
    try {
      const input = toInput(deps.draft, deps.planningTypes);
      const saved = deps.id === null
        ? await deps.parameters.createParameter(input)
        : await deps.parameters.updateParameter(deps.id, input);
      deps.setProfile(saved);
      deps.setDraft(toDraft(saved));
      deps.setEditing(false);
      if (deps.id === null) deps.onCreated(saved.id);
    } catch (failure) {
      deps.setError(failure instanceof Error ? failure.message : 'Impossible d’enregistrer le paramètre.');
    } finally {
      deps.setSaving(false);
    }
  };
}
