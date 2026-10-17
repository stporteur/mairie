import type { ParameterProfile } from '@shared/types/parameters';
import { toDraft } from '@/domain/parameters/draft';
import type { ParameterDraft } from '@/domain/parameters/types';
import type { StateSetter } from '../types';

export interface CancelParameterEditDeps {
  profile: ParameterProfile | null;
  setDraft: StateSetter<ParameterDraft>;
  setEditing: StateSetter<boolean>;
  setError: StateSetter<string>;
  /** Called when there is nothing to go back to, i.e. a creation was cancelled. */
  onCancelCreation: () => void;
}

export function createCancelParameterEdit({ profile, setDraft, setEditing, setError, onCancelCreation }: CancelParameterEditDeps) {
  return (): void => {
    setError('');
    if (!profile) {
      onCancelCreation();
      return;
    }
    setDraft(toDraft(profile));
    setEditing(false);
  };
}
