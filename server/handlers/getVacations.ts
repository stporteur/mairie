import type { Request, Response } from 'express';
import type { HistoricalVacation } from '../../shared/vacations';
import { isSupportedVacationYear, resolveVacationsForYear } from '../domain/vacations';
import type { OfficialVacationsData } from '../domain/vacations';
import type { OfficialVacationsSource } from '../ports/OfficialVacationsSource';
import type { VacationHistoryRepository } from '../ports/VacationHistoryRepository';

export interface GetVacationsDeps {
  officialVacations: OfficialVacationsSource;
  history: VacationHistoryRepository;
}

export function createGetVacations({ officialVacations, history }: GetVacationsDeps) {
  return async (req: Request, res: Response): Promise<void> => {
    const year = Number(req.params.year);
    if (!isSupportedVacationYear(year)) {
      res.status(400).json({ error: 'L’année doit être un entier compris entre 2020 et 2059.' });
      return;
    }

    let official: OfficialVacationsData | null = null;
    try {
      official = await officialVacations.getOfficialVacations();
    } catch {
      // Continue with the estimate if the source is unavailable.
    }

    let past: HistoricalVacation[] = [];
    try {
      past = await history.findAll();
    } catch {
      // Without history, only the fixed-rule periods (Christmas, summer) are estimated.
    }

    res.json({ year, zone: 'C', ...resolveVacationsForYear(year, official, past) });
  };
}
