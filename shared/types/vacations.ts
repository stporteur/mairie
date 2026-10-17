export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
  estimated?: boolean;
}

export interface VacationSource {
  local?: boolean;
  estimated?: boolean;
  dataset?: string;
  resource?: {
    id?: string;
    title?: string;
    url?: string;
  };
}

export interface ResolvedVacations {
  vacations: VacationPeriod[];
  source: VacationSource;
}

export interface VacationsResponse extends ResolvedVacations {
  year: number;
  zone: string;
}
