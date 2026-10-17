import type { AtsemHours, StandardHours } from '@shared/types/parameters';

/** Names of the API sections holding the type-specific values. */
export type SectionKey = 'atsem' | 'standard';

export interface FieldDefinition {
  key: string;
  label: string;
  kind: 'number' | 'text' | 'weekdays';
  step?: string;
}

/** Describes the form shown for one planning type and the table behind it. */
export interface SectionDefinition {
  key: SectionKey;
  title: string;
  fields: readonly FieldDefinition[];
}

/** Form values, kept as strings so that fields can be empty while typing. */
export interface ParameterDraft {
  name: string;
  holidays: string;
  rtt: string;
  planningTypeId: string;
  sections: Record<SectionKey, Record<string, string>>;
}

export type ParameterSectionValues = AtsemHours | StandardHours;

export type LoadStatus = 'loading' | 'ready' | 'error';
