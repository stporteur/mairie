import type { Request, Response } from 'express';
import type { GeneratedWorkbook } from '../export/GeneratedWorkbook';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type WorkbookGenerator<TRequest> = (request: TRequest) => Promise<GeneratedWorkbook>;

/** Builds an Express handler that streams a generated workbook, or answers 400 with the error. */
export function createWorkbookHandler<TRequest>(
  generate: WorkbookGenerator<TRequest>,
  fallbackMessage: string,
) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await generate(req.body as TRequest);
      res.setHeader('Content-Type', result.contentType ?? XLSX_CONTENT_TYPE);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.status(200).send(Buffer.from(result.buffer));
    } catch (error) {
      const message = error instanceof Error ? error.message : fallbackMessage;
      res.status(400).json({ error: message });
    }
  };
}
