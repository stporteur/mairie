import type { ParameterInput, PlanningTypeOption } from '../../../shared/types/parameters';

const MAX_NAME_LENGTH = 128;
const MAX_OFFDAYS_LENGTH = 64;
const MAX_WEEK_HOURS = 168;

function isQuota(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0);
}

function isHours(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_WEEK_HOURS);
}

function isOffdays(value: unknown): boolean {
  return value === null || (typeof value === 'string' && value.length <= MAX_OFFDAYS_LENGTH);
}

function validateSection(code: string, input: ParameterInput): string | null {
  if (code === 'ATSEM') {
    const { atsem } = input;
    if (!atsem) return 'Les heures ATSEM sont obligatoires pour ce type.';
    if (!isHours(atsem.holidayPeriodHours) || !isHours(atsem.schoolPeriodHours)) return 'Heures hebdomadaires invalides.';
    if (!isOffdays(atsem.holidayPeriodOffdays) || !isOffdays(atsem.schoolPeriodOffdays)) return 'Jours de repos invalides.';
  }
  if (code === 'STANDARD') {
    if (!input.standard) return 'Les heures standard sont obligatoires pour ce type.';
    if (!isHours(input.standard.weekHours)) return 'Heures hebdomadaires invalides.';
  }
  return null;
}

/** Returns the first problem found in a profile sent by a client, or null when it can be saved. */
export function validateParameterInput(input: ParameterInput, planningTypes: PlanningTypeOption[]): string | null {
  if (typeof input?.name !== 'string' || input.name.trim() === '') return 'Le nom est obligatoire.';
  if (input.name.trim().length > MAX_NAME_LENGTH) return `Le nom ne doit pas dépasser ${MAX_NAME_LENGTH} caractères.`;
  if (!isQuota(input.holidays) || !isQuota(input.rtt)) return 'Les jours de congés doivent être des entiers positifs.';

  const planningType = planningTypes.find((type) => type.id === input.planningTypeId);
  if (!planningType) return 'Le type de paramètre est obligatoire.';

  return validateSection(planningType.code, input);
}
