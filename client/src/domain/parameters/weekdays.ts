export const WEEKDAYS = [
  { value: 'lundi', label: 'Lundi', number: 1 },
  { value: 'mardi', label: 'Mardi', number: 2 },
  { value: 'mercredi', label: 'Mercredi', number: 3 },
  { value: 'jeudi', label: 'Jeudi', number: 4 },
  { value: 'vendredi', label: 'Vendredi', number: 5 },
] as const;

export const WEEKDAY_SEPARATOR = ',';

/** Weekday numbers (`Date#getUTCDay` convention) of a stored list. */
export function toWeekdayNumbers(value: string | null | undefined): number[] {
  const selected = new Set(parseWeekdays(value ?? ''));
  return WEEKDAYS.filter((day) => selected.has(day.value)).map((day) => day.number);
}

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
