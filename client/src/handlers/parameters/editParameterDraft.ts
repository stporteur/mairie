import { setDraftField, setSectionField, type DraftField } from '@/domain/parameters/draft';
import type { ParameterDraft, SectionKey } from '@/domain/parameters/types';
import type { StateSetter } from '../types';

export interface EditParameterDraftDeps {
  setDraft: StateSetter<ParameterDraft>;
  clearError: () => void;
}

export function createChangeParameterField({ setDraft, clearError }: EditParameterDraftDeps) {
  return (field: DraftField, value: string): void => {
    setDraft((current) => setDraftField(current, field, value));
    clearError();
  };
}

export function createChangeSectionField({ setDraft, clearError }: EditParameterDraftDeps) {
  return (section: SectionKey, key: string, value: string): void => {
    setDraft((current) => setSectionField(current, section, key, value));
    clearError();
  };
}
