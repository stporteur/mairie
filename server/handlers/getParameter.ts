import type { Request, Response } from 'express';
import type { ParametersRepository } from '../ports/ParametersRepository';

export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function createGetParameter(repository: ParametersRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Identifiant invalide.' });
      return;
    }
    try {
      const parameter = await repository.findById(id);
      if (!parameter) {
        res.status(404).json({ error: 'Paramètre introuvable.' });
        return;
      }
      res.json(parameter);
    } catch {
      res.status(500).json({ error: 'Impossible de lire le paramètre.' });
    }
  };
}
