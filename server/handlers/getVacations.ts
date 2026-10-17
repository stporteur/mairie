import type { Request, Response } from 'express';
import { isSupportedVacationYear, resolveVacationsForYear } from '../domain/vacations';
import type { OfficialVacationsData } from '../domain/vacations';
import type { OfficialVacationsSource } from '../ports/OfficialVacationsSource';

export function createGetVacations(source: OfficialVacationsSource) {
  return async (req: Request, res: Response): Promise<void> => {
    const year = Number(req.params.year);
    if (!isSupportedVacationYear(year)) {
      res.status(400).json({ error: 'L’année doit être un entier compris entre 2020 et 2059.' });
      return;
    }

    let official: OfficialVacationsData | null = null;
    try {
      official = await source.getOfficialVacations();
    } catch {
      // Continue with local data and then the estimate if the source is unavailable.
    }

    res.json({ year, zone: 'C', ...resolveVacationsForYear(year, official) });
  };
}
