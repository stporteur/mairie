import type { ParameterInput, ParameterProfile, PlanningTypeOption } from '@shared/types/parameters';
import { getSection, PARAMETER_SECTIONS } from './sections';
import type { FieldDefinition, ParameterDraft, ParameterSectionValues, SectionKey } from './types';
import { joinWeekdays, parseWeekdays } from './weekdays';

function emptySections(): ParameterDraft['sections'] {
  return { atsem: {}, standard: {} };
}

export function emptyDraft(): ParameterDraft {
  return { name: '', holidays: '', rtt: '', planningTypeId: '', sections: emptySections() };
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export function toDraft(profile: ParameterProfile): ParameterDraft {
  const sections = emptySections();
  for (const definition of Object.values(PARAMETER_SECTIONS)) {
    const source = profile[definition.key] as Record<string, unknown> | null;
    for (const field of definition.fields) {
      sections[definition.key][field.key] = text(source?.[field.key]);
    }
  }
  return {
    name: profile.name,
    holidays: text(profile.holidays),
    rtt: text(profile.rtt),
    planningTypeId: text(profile.planningTypeId),
    sections,
  };
}

export type DraftField = 'name' | 'holidays' | 'rtt' | 'planningTypeId';

export function setDraftField(draft: ParameterDraft, field: DraftField, value: string): ParameterDraft {
  return { ...draft, [field]: value };
}

export function setSectionField(draft: ParameterDraft, section: SectionKey, key: string, value: string): ParameterDraft {
  return { ...draft, sections: { ...draft.sections, [section]: { ...draft.sections[section], [key]: value } } };
}

export function findPlanningTypeCode(planningTypes: PlanningTypeOption[], planningTypeId: string): string | undefined {
  return planningTypes.find((type) => String(type.id) === planningTypeId)?.code;
}

function toNumber(value: string | undefined): number | null {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : Number(trimmed.replace(',', '.'));
}

function toNullableText(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

function toInputValue(field: FieldDefinition, value: string | undefined): number | string | null {
  if (field.kind === 'number') return toNumber(value);
  if (field.kind === 'weekdays') return toNullableText(joinWeekdays(parseWeekdays(value ?? '')));
  return toNullableText(value);
}

/** Builds the API payload; only the section of the selected planning type is filled. */
export function toInput(draft: ParameterDraft, planningTypes: PlanningTypeOption[]): ParameterInput {
  const input: ParameterInput = {
    name: draft.name.trim(),
    holidays: toNumber(draft.holidays),
    rtt: toNumber(draft.rtt),
    planningTypeId: draft.planningTypeId === '' ? null : Number(draft.planningTypeId),
    atsem: null,
    standard: null,
  };

  const definition = getSection(findPlanningTypeCode(planningTypes, draft.planningTypeId));
  if (definition) {
    const values = Object.fromEntries(definition.fields.map((field) => [
      field.key,
      toInputValue(field, draft.sections[definition.key][field.key]),
    ]));
    Object.assign(input, { [definition.key]: values as unknown as ParameterSectionValues });
  }
  return input;
}
