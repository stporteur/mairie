import type { PlanningTypeOption } from '@shared/types/parameters';
import { findPlanningTypeCode } from './draft';
import { getSection, MAX_OFFDAYS_LENGTH, MAX_WEEK_HOURS } from './sections';
import type { FieldDefinition, ParameterDraft } from './types';

function invalidNumber(value: string, { integerOnly, max }: { integerOnly: boolean; max?: number }): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  const number = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(number) || number < 0) return true;
  if (integerOnly && !Number.isInteger(number)) return true;
  return max !== undefined && number > max;
}

function invalidField(field: FieldDefinition, value: string): boolean {
  return field.kind === 'number'
    ? invalidNumber(value, { integerOnly: false, max: MAX_WEEK_HOURS })
    : value.trim().length > MAX_OFFDAYS_LENGTH;
}

/** Returns the first problem in the draft, or null when it can be saved. */
export function validateParameterDraft(draft: ParameterDraft, planningTypes: PlanningTypeOption[]): string | null {
  if (draft.name.trim() === '') return 'Le nom est obligatoire.';
  if (invalidNumber(draft.holidays, { integerOnly: true }) || invalidNumber(draft.rtt, { integerOnly: true })) {
    return 'Les jours de CP et de RTT doivent être des entiers positifs.';
  }

  const code = findPlanningTypeCode(planningTypes, draft.planningTypeId);
  if (code === undefined) return 'Choisissez un type de paramètre.';

  const section = getSection(code);
  const invalid = section?.fields.find((field) => invalidField(field, draft.sections[section.key][field.key] ?? ''));
  return invalid ? `Valeur invalide pour « ${invalid.label} ».` : null;
}
