import type { Request, Response } from 'express';
import type { ParametersRepository } from '../ports/ParametersRepository';

export function createGetParameters(repository: ParametersRepository) {
  return async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await repository.findAll());
    } catch {
      res.status(500).json({ error: 'Impossible de lire les paramètres.' });
    }
  };
}
