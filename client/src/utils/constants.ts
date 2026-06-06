// Constants for vacation keywords
export const VACATION_KEYWORDS = {
  SMALL: ['noël', 'noel', 'hiver', 'printemps', 'toussaint'] as const,
  SUMMER: ['été', 'ete', 'grandes vacances', "vacances d'été", 'vacances ete'] as const,
};

// Default vacation ranges for a given year
export function getDefaultVacationRanges(year: number) {
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

// Month names
export const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;
