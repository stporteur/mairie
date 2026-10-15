export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
  estimated?: boolean;
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

const DAYS_IN_TWO_WEEKS = 15;

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function alignToSaturdayOnOrBefore(date: Date): Date {
  const aligned = new Date(date);
  aligned.setUTCDate(aligned.getUTCDate() - ((aligned.getUTCDay() + 1) % 7));
  return aligned;
}

function addTwoWeekPeriod(name: string, approximateStart: string): VacationPeriod {
  const startDate = alignToSaturdayOnOrBefore(parseIsoDate(approximateStart));
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + DAYS_IN_TWO_WEEKS);

  return {
    name,
    start: formatIsoDate(startDate),
    end: formatIsoDate(endDate),
  };
}

function estimatedChristmasPeriod(year: number, name: string): VacationPeriod {
  const nextNewYear = new Date(Date.UTC(year + 1, 0, 1));
  if (nextNewYear.getUTCDay() === 1) {
    return {
      name,
      start: `${year}-12-16`,
      end: `${year}-12-31`,
    };
  }

  return addTwoWeekPeriod(name, `${year}-12-25`);
}

function estimatedSummerStart(year: number): string {
  // Estimated summer holidays begin on the first Saturday in July.
  const start = new Date(Date.UTC(year, 6, 1));
  start.setUTCDate(start.getUTCDate() + ((6 - start.getUTCDay() + 7) % 7));
  return formatIsoDate(start);
}

export function buildEstimatedVacationPeriods(year: number): VacationPeriod[] {
  const ranges = getDefaultVacationRanges(year);
  const previousChristmas = estimatedChristmasPeriod(year - 1, 'Vacances de Noël (début d’année)');
  const januaryStart = `${year}-01-01`;
  const januaryEnd = `${year}-01-31`;
  const januaryChristmas = previousChristmas.end >= januaryStart
    ? {
        ...previousChristmas,
        start: januaryStart,
        end: previousChristmas.end > januaryEnd ? januaryEnd : previousChristmas.end,
      }
    : null;
  const christmasEnd = estimatedChristmasPeriod(year, 'Vacances de Noël (fin d’année)');

  return [
    ...(januaryChristmas ? [januaryChristmas] : []),
    addTwoWeekPeriod('Vacances d’hiver', ranges.hiverStart),
    addTwoWeekPeriod('Vacances de printemps', ranges.printempsStart),
    { name: 'Grandes vacances', start: estimatedSummerStart(year), end: ranges.eteEnd },
    addTwoWeekPeriod('Vacances de la Toussaint', ranges.toussaintStart),
    christmasEnd,
  ];
}