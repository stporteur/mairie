import type { Request, Response } from 'express';

export function getStatus(_req: Request, res: Response): void {
  res.json({ status: 'ok', app: 'Planning ATSEM', city: "Mairie de L'Haÿ-les-Roses" });
}
