export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
}

export interface DefaultVacationRanges {
  noelDebutStart: string;
  noelDebutEnd: string;
  hiverStart: string;
  hiverEnd: string;
  printempsStart: string;
  printempsEnd: string;
  eteStart: string;
  eteEnd: string;
  toussaintStart: string;
  toussaintEnd: string;
  noelFinStart: string;
  noelFinEnd: string;
}

/** Fixed month/day ranges used only when no official or local data exists. */
export function getDefaultVacationRanges(year: number): DefaultVacationRanges {
  return {
    noelDebutStart: `${year}-01-01`,
    noelDebutEnd: `${year}-01-05`,
    hiverStart: `${year}-02-12`,
    hiverEnd: `${year}-02-28`,
    printempsStart: `${year}-04-16`,
    printempsEnd: `${year}-05-02`,
    eteStart: `${year}-07-06`,
    eteEnd: `${year}-08-31`,
    toussaintStart: `${year}-10-23`,
    toussaintEnd: `${year}-11-07`,
    noelFinStart: `${year}-12-20`,
    noelFinEnd: `${year}-12-31`,
  };
}

export function buildEstimatedVacationPeriods(year: number): VacationPeriod[] {
  const ranges = getDefaultVacationRanges(year);

  return [
    { name: 'Vacances de Noël (début d’année)', start: ranges.noelDebutStart, end: ranges.noelDebutEnd },
    { name: 'Vacances d’hiver', start: ranges.hiverStart, end: ranges.hiverEnd },
    { name: 'Vacances de printemps', start: ranges.printempsStart, end: ranges.printempsEnd },
    { name: 'Grandes vacances', start: ranges.eteStart, end: ranges.eteEnd },
    { name: 'Vacances de la Toussaint', start: ranges.toussaintStart, end: ranges.toussaintEnd },
    { name: 'Vacances de Noël (fin d’année)', start: ranges.noelFinStart, end: ranges.noelFinEnd },
  ];
}