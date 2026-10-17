import path from 'path';
import type { Request, Response } from 'express';

export function createServeSpa(clientDist: string) {
  return (_req: Request, res: Response): void => {
    res.sendFile(path.join(clientDist, 'index.html'));
  };
}
