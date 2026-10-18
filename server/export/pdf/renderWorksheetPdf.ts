import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';

export const PDF_CONTENT_TYPE = 'application/pdf';
export const A3_LANDSCAPE: [number, number] = [1190.55, 841.89];
export const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const MARGIN_X = 18;
const MARGIN_Y = 28;
const PX_TO_PT = 0.75;

// Office theme palette, indexed like Excel's theme colors (lt1, dk1, lt2, dk2, accent1..6).
const THEME_COLORS = ['FFFFFF', '000000', 'E8E8E8', '0E2841', '156082', 'E97132', '196B24', '0F9ED5', 'A02B93', '4EA72E'];

interface Box { x: number; y: number; width: number; height: number }

function applyTint(hex: string, tint: number): string {
  if (!tint) return hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue /= 6;
  }
  lightness = tint < 0 ? lightness * (1 + tint) : lightness * (1 - tint) + tint;
  const channel = (offset: number): number => {
    if (saturation === 0) return lightness;
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    let t = hue + offset;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [channel(1 / 3), channel(0), channel(-1 / 3)]
    .map((value) => Math.round(value * 255).toString(16).padStart(2, '0'))
    .join('');
}

function resolveColor(color: Partial<ExcelJS.Color> | undefined): string | null {
  if (!color) return null;
  if (color.argb) return color.argb.slice(-6);
  if (typeof color.theme === 'number' && THEME_COLORS[color.theme]) {
    return applyTint(THEME_COLORS[color.theme], (color as { tint?: number }).tint ?? 0);
  }
  return null;
}

function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

function drawBorders(doc: PDFKit.PDFDocument, cell: ExcelJS.Cell, box: Box): void {
  const { x, y, width, height } = box;
  const sides: Array<[Partial<ExcelJS.Border> | undefined, number, number, number, number]> = [
    [cell.border?.top, x, y, x + width, y],
    [cell.border?.bottom, x, y + height, x + width, y + height],
    [cell.border?.left, x, y, x, y + height],
    [cell.border?.right, x + width, y, x + width, y + height],
  ];
  for (const [border, x1, y1, x2, y2] of sides) {
    if (!border?.style) continue;
    const thick = border.style === 'medium' || border.style === 'thick';
    doc.lineWidth(thick ? 1.2 : 0.5).strokeColor(`#${resolveColor(border.color) ?? '000000'}`)
      .moveTo(x1, y1).lineTo(x2, y2).stroke();
  }
}

interface TextRun { text: string; bold: boolean; size: number; color: string }

function formatNumber(value: number, numFmt?: string): string {
  const decimals = numFmt?.split('.')[1]?.length ?? 2;
  const text = numFmt?.includes('.') ? value.toFixed(decimals) : String(Math.round(value * 100) / 100);
  return text.replace('.', ',');
}

/** One run per line: rich text keeps its own font per part, other values use the cell font. */
function cellRuns(cell: ExcelJS.Cell): TextRun[] {
  const base = {
    bold: Boolean(cell.font?.bold),
    size: cell.font?.size ?? 11,
    color: resolveColor(cell.font?.color) ?? '000000',
  };
  const value = cell.value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.flatMap((part) => part.text.split('\n').filter(Boolean).map((text) => ({
      text,
      bold: Boolean(part.font?.bold),
      size: part.font?.size ?? base.size,
      color: resolveColor(part.font?.color) ?? base.color,
    })));
  }
  let text: string;
  if (typeof value === 'number') text = formatNumber(value, cell.numFmt);
  else if (typeof value === 'object') {
    if ('result' in value && typeof value.result === 'number') text = formatNumber(value.result, cell.numFmt);
    else if ('result' in value && value.result !== undefined) text = String(value.result);
    else if (value instanceof Date) text = value.toLocaleDateString('fr-FR');
    else text = '';
  } else text = String(value);
  return text ? [{ text, ...base }] : [];
}

function drawText(doc: PDFKit.PDFDocument, cell: ExcelJS.Cell, runs: TextRun[], box: Box, scale: number): void {
  const alignment = cell.alignment ?? {};
  const rotation = typeof alignment.textRotation === 'number' ? alignment.textRotation : 0;
  const rotated = rotation !== 0;
  const padding = 1.5;
  const area = rotated ? { width: box.height, height: box.width } : { width: box.width, height: box.height };
  const available = area.width - padding * 2;
  const wrap = Boolean(alignment.wrapText);

  const measure = (run: TextRun, factor: number): number => {
    doc.font(run.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(run.size * scale * factor);
    return wrap ? Math.max(...run.text.split(/\s+/).map((word) => doc.widthOfString(word))) : doc.widthOfString(run.text);
  };
  // Helvetica is wider than the template's Aptos Narrow: shrink so the widest run still fits.
  const factor = Math.min(1, ...runs.map((run) => available / measure(run, 1)));

  const options: PDFKit.Mixins.TextOptions = {
    width: available,
    align: alignment.horizontal === 'center' ? 'center' : alignment.horizontal === 'right' ? 'right' : 'left',
    lineBreak: wrap,
  };
  const heights = runs.map((run) => {
    doc.font(run.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(run.size * scale * factor);
    return wrap ? doc.heightOfString(run.text, options) : run.size * scale * factor;
  });
  const textHeight = heights.reduce((sum, value) => sum + value, 0);
  let offsetY = alignment.vertical === 'top' ? 0
    : alignment.vertical === 'bottom' ? area.height - textHeight
      : (area.height - textHeight) / 2;
  offsetY = Math.max(offsetY, 0);

  doc.save();
  doc.rect(box.x, box.y, box.width, box.height).clip();
  if (rotated) doc.translate(box.x + box.width / 2, box.y + box.height / 2).rotate(rotation < 0 ? 90 : -90);
  const left = (rotated ? -area.width / 2 : box.x) + padding;
  let top = (rotated ? -area.height / 2 : box.y) + offsetY;
  runs.forEach((run, index) => {
    doc.font(run.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(run.size * scale * factor).fillColor(`#${run.color}`);
    doc.text(run.text, left, top, options);
    top += heights[index];
  });
  doc.restore();
}

export interface WorksheetPdfOptions {
  title: string;
  pageSize: [number, number];
  columns: number;
  rows: number;
  /** Excel never enlarges a printout; 1 keeps small tables at their natural size. */
  maxScale?: number;
  centerVertically?: boolean;
}

/** Draws the first columns × rows cells of a worksheet on a single landscape page, scaled to fit. */
export async function renderWorksheetPdf(worksheet: ExcelJS.Worksheet, options: WorksheetPdfOptions): Promise<Buffer> {
  const defaultColumnWidth = worksheet.properties.defaultColWidth ?? 8.43;
  const defaultRowHeight = worksheet.properties.defaultRowHeight ?? 15;
  const columnWidths = Array.from({ length: options.columns }, (_, index) => {
    const width = worksheet.getColumn(index + 1).width ?? defaultColumnWidth;
    return (width * 7 + 5) * PX_TO_PT;
  });
  const rowHeights = Array.from({ length: options.rows }, (_, index) => worksheet.getRow(index + 1).height ?? defaultRowHeight);

  const totalWidth = columnWidths.reduce((sum, value) => sum + value, 0);
  const totalHeight = rowHeights.reduce((sum, value) => sum + value, 0);
  const [pageWidth, pageHeight] = options.pageSize;
  const scale = Math.min(
    (pageWidth - 2 * MARGIN_X) / totalWidth,
    (pageHeight - 2 * MARGIN_Y) / totalHeight,
    options.maxScale ?? Infinity,
  );
  const originX = (pageWidth - totalWidth * scale) / 2;
  const originY = options.centerVertically === false ? MARGIN_Y : (pageHeight - totalHeight * scale) / 2;

  const columnStarts: number[] = [];
  columnWidths.reduce((sum, value) => { columnStarts.push(originX + sum * scale); return sum + value; }, 0);
  const rowStarts: number[] = [];
  rowHeights.reduce((sum, value) => { rowStarts.push(originY + sum * scale); return sum + value; }, 0);

  const cellBox = (row: number, column: number, rowSpan = 1, columnSpan = 1): Box => ({
    x: columnStarts[column - 1],
    y: rowStarts[row - 1],
    width: columnWidths.slice(column - 1, column - 1 + columnSpan).reduce((sum, value) => sum + value, 0) * scale,
    height: rowHeights.slice(row - 1, row - 1 + rowSpan).reduce((sum, value) => sum + value, 0) * scale,
  });

  const merges = new Map<string, { rowSpan: number; columnSpan: number }>();
  for (const range of worksheet.model.merges ?? []) {
    const [start, end] = range.split(':').map((address) => worksheet.getCell(address));
    merges.set(start.address, {
      rowSpan: Number(end.row) - Number(start.row) + 1,
      columnSpan: Number(end.col) - Number(start.col) + 1,
    });
  }

  const doc = new PDFDocument({ size: options.pageSize, layout: 'portrait', margin: 0, info: { Title: options.title } });

  const cells: Array<{ cell: ExcelJS.Cell; box: Box; own: Box; isMaster: boolean }> = [];
  for (let row = 1; row <= options.rows; row += 1) {
    for (let column = 1; column <= options.columns; column += 1) {
      const cell = worksheet.getCell(row, column);
      const merge = merges.get(cell.address);
      const isSlave = cell.isMerged && !merge;
      cells.push({
        cell,
        box: merge ? cellBox(row, column, merge.rowSpan, merge.columnSpan) : cellBox(row, column),
        own: cellBox(row, column),
        isMaster: !isSlave,
      });
    }
  }

  for (const { cell, own } of cells) {
    const fill = cell.fill;
    const color = fill && fill.type === 'pattern' && fill.pattern === 'solid' ? resolveColor(fill.fgColor) : null;
    if (color) doc.rect(own.x, own.y, own.width, own.height).fill(`#${color}`);
  }
  for (const { cell, box, isMaster } of cells) {
    const runs = isMaster ? cellRuns(cell) : [];
    if (runs.length) drawText(doc, cell, runs, box, scale);
  }
  for (const { cell, own } of cells) drawBorders(doc, cell, own);

  return toBuffer(doc);
}

export async function loadFirstWorksheet(buffer: ExcelJS.Buffer, name: string): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(name);
  if (!worksheet) throw new Error(`La feuille ${name} est absente du classeur.`);
  return worksheet;
}

export function pdfResult(buffer: Buffer, filename: string): GeneratedWorkbook {
  return { buffer: buffer as unknown as ExcelJS.Buffer, filename, contentType: PDF_CONTENT_TYPE };
}

