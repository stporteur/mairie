import type { Request, Response } from 'express';
import type { ParameterInput } from '../../shared/types/parameters';
import { validateParameterInput } from '../domain/parameters/validateParameterInput';
import type { ParametersRepository } from '../ports/ParametersRepository';
import type { PlanningTypesRepository } from '../ports/PlanningTypesRepository';
import { parseId } from './getParameter';

export interface SaveParameterDeps {
  parameters: ParametersRepository;
  planningTypes: PlanningTypesRepository;
}

export function createCreateParameter({ parameters, planningTypes }: SaveParameterDeps) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body as ParameterInput;
      const error = validateParameterInput(input, await planningTypes.findAll());
      if (error) {
        res.status(400).json({ error });
        return;
      }
      res.status(201).json(await parameters.create(input));
    } catch {
      res.status(500).json({ error: 'Impossible d’enregistrer le paramètre.' });
    }
  };
}

export function createUpdateParameter({ parameters, planningTypes }: SaveParameterDeps) {
  return async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Identifiant invalide.' });
      return;
    }
    try {
      const input = req.body as ParameterInput;
      const error = validateParameterInput(input, await planningTypes.findAll());
      if (error) {
        res.status(400).json({ error });
        return;
      }
      const updated = await parameters.update(id, input);
      if (!updated) {
        res.status(404).json({ error: 'Paramètre introuvable.' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Impossible d’enregistrer le paramètre.' });
    }
  };
}
