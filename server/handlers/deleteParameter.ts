import type { Request, Response } from 'express';
import type { ParametersRepository } from '../ports/ParametersRepository';
import { parseId } from './getParameter';

export function createDeleteParameter(repository: ParametersRepository) {
  return async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Identifiant invalide.' });
      return;
    }
    try {
      if (!(await repository.delete(id))) {
        res.status(404).json({ error: 'Paramètre introuvable.' });
        return;
      }
      res.status(204).end();
    } catch {
      res.status(500).json({ error: 'Impossible de supprimer le paramètre.' });
    }
  };
}
