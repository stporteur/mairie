import type { Request, Response } from 'express';
import type { PlanningTypesRepository } from '../ports/PlanningTypesRepository';

export function createGetPlanningTypes(repository: PlanningTypesRepository) {
  return async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await repository.findAll());
    } catch {
      res.status(500).json({ error: 'Impossible de lire les types de paramètres.' });
    }
  };
}
