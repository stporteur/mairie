export const WEEKDAYS = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
] as const;

export const WEEKDAY_SEPARATOR = ',';

/** Reads a stored list ("lundi,mercredi"), tolerating spaces and case, ignoring unknown values. */
export function parseWeekdays(value: string): string[] {
  const wanted = new Set(value.split(WEEKDAY_SEPARATOR).map((part) => part.trim().toLowerCase()));
  return WEEKDAYS.filter((day) => wanted.has(day.value)).map((day) => day.value);
}

/** Week-ordered join with a bare comma, no spaces. */
export function joinWeekdays(days: readonly string[]): string {
  const selected = new Set(days);
  return WEEKDAYS.filter((day) => selected.has(day.value)).map((day) => day.value).join(WEEKDAY_SEPARATOR);
}

export function toggleWeekday(value: string, day: string, checked: boolean): string {
  const days = parseWeekdays(value).filter((current) => current !== day);
  return joinWeekdays(checked ? [...days, day] : days);
}

export function describeWeekdays(value: string): string {
  const labels = parseWeekdays(value).map((day) => WEEKDAYS.find((entry) => entry.value === day)?.label ?? day);
  return labels.length > 0 ? labels.join(', ') : 'Aucun';
}
