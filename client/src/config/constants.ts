export const VACATION_KEYWORDS = {
  SMALL: ['noël', 'noel', 'hiver', 'printemps', 'toussaint'] as const,
  SUMMER: ['été', 'ete', 'grandes vacances', "vacances d'été", 'vacances ete'] as const,
};

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

export const WEEKDAY_INITIALS = ['D', 'L', 'M', 'Me', 'J', 'V', 'S'] as const;

export const ANNUAL_HOURS_LIMIT = 1607;
export const FORECAST_YEAR_COUNT = 10;
export const DEFAULT_YEAR = 2026;
export const CP_DAYS_PER_VACATION_PERIOD = 5;

export const PAGES = {
  planning: {
    title: 'Planning ATSEM',
    subtitle: 'Analyse annuelle du temps de travail, des congés et de la formation.',
  },
  forecast: {
    title: 'Prévisionnel',
    subtitle: 'Projection des heures et congés sur les dix prochaines années.',
  },
} as const;

export type PageName = keyof typeof PAGES;
