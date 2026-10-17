import type { PlanningTypeCode } from '@shared/types/parameters';
import type { SectionDefinition } from './types';

/**
 * One entry per planning type: adding a type means adding its form here
 * (and its table on the server), nothing else on the client.
 */
export const PARAMETER_SECTIONS: Record<PlanningTypeCode, SectionDefinition> = {
  STANDARD: {
    key: 'standard',
    title: 'Horaires standard',
    fields: [
      { key: 'weekHours', label: 'Heures/semaine', kind: 'number', step: '0.25' },
    ],
  },
  ATSEM: {
    key: 'atsem',
    title: 'Horaires ATSEM',
    fields: [
      { key: 'schoolPeriodHours', label: 'Heures/semaine Scolaire', kind: 'number', step: '0.25' },
      { key: 'schoolPeriodOffdays', label: 'Jours de repos Scolaire', kind: 'weekdays' },
      { key: 'holidayPeriodHours', label: 'Heures/semaine Vacances', kind: 'number', step: '0.25' },
      { key: 'holidayPeriodOffdays', label: 'Jours de repos Vacances', kind: 'weekdays' },
    ],
  },
};

export const MAX_WEEK_HOURS = 168;
export const MAX_OFFDAYS_LENGTH = 64;

export function getSection(code: string | undefined): SectionDefinition | undefined {
  return code !== undefined && Object.hasOwn(PARAMETER_SECTIONS, code)
    ? PARAMETER_SECTIONS[code as PlanningTypeCode]
    : undefined;
}
