/** Keys identifying a school holiday period in the history, without accents. */
export const VACATION_KEYS = ['noel', 'hiver', 'printemps', 'ete', 'toussaint'] as const;

export type VacationKey = (typeof VACATION_KEYS)[number];

/** One past holiday period (zone C), as stored in `holidays_history`. */
export interface HistoricalVacation {
  name: string;
  start: string;
  end: string;
}
