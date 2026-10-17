import type ExcelJS from 'exceljs';

export interface GeneratedWorkbook {
  buffer: ExcelJS.Buffer;
  filename: string;
}
