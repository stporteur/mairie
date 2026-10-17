import path from 'path';
import ExcelJS from 'exceljs';
import type { ExportCalendarDay, ExportCalendarRequest } from '../../../shared/types/export';
import type { GeneratedWorkbook } from '../GeneratedWorkbook';
import { safeProfileName } from '../safeProfileName';

const MONTH_START_ROWS = Array.from({ length: 12 }, (_, index) => 1 + index * 5);
const FIRST_DAY_COLUMN = 2; // B
const LAST_DAY_COLUMN = 32; // AF

const WEEKDAY_LABELS = ['D', 'L', 'M', 'Me', 'J', 'V', 'S'];
const APP_COLORS = {
  headerBackground: 'FF111827',
  headerText: 'FFFFFFFF',
  officialVacationBackground: 'FFD8F3DC',
  officialVacationText: 'FF1F6F4F',
  estimatedVacationBackground: 'FFFEF3C7',
  estimatedVacationHeaderBackground: 'FFFDE68A',
  estimatedVacationText: 'FF92400E',
  estimatedVacationOffdayBackground: 'FFFDE68A',
  offdayBackground: 'FFD1D5DB',
  restDayBackground: 'FFEFF2F7',
  weekdayBackground: 'FFFFFFFF',
};

function isValidIsoDate(value: string, year: number): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) !== year) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function setCellColors(cell: ExcelJS.Cell, fillColor: string, fontColor?: string): void {
  cell.style = {
    ...cell.style,
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
    ...(fontColor ? { font: { ...cell.font, color: { argb: fontColor } } } : {}),
  };
}

function setHeaderColors(cell: ExcelJS.Cell, day?: ExportCalendarDay): void {
  if (!day || !day.inVacation) {
    setCellColors(cell, APP_COLORS.headerBackground, APP_COLORS.headerText);
  } else if (day.vacationEstimated) {
    setCellColors(cell, APP_COLORS.estimatedVacationHeaderBackground, APP_COLORS.estimatedVacationText);
  } else {
    setCellColors(cell, APP_COLORS.officialVacationBackground, APP_COLORS.officialVacationText);
  }
}

function setCalendarBodyColors(cell: ExcelJS.Cell, day?: ExportCalendarDay): void {
  if (!day) {
    setCellColors(cell, APP_COLORS.weekdayBackground, 'FF111827');
  } else if (day.inVacation && day.vacationEstimated) {
    const isEstimatedOffday = day.isWeekend || day.isHoliday;
    setCellColors(
      cell,
      isEstimatedOffday ? APP_COLORS.estimatedVacationOffdayBackground : APP_COLORS.estimatedVacationBackground,
      'FF111827',
    );
  } else if (day.isRestDay) {
    setCellColors(cell, APP_COLORS.restDayBackground, 'FF111827');
  } else if (day.isWeekend || day.isHoliday) {
    setCellColors(cell, APP_COLORS.offdayBackground, 'FF111827');
  } else if (day.inVacation) {
    setCellColors(cell, APP_COLORS.weekdayBackground, 'FF111827');
  } else {
    setCellColors(cell, APP_COLORS.weekdayBackground, 'FF111827');
  }
}

export async function generateCalendarWorkbook(
  request: ExportCalendarRequest,
  templatePath = path.resolve(__dirname, '..', '..', 'template', 'Horaires.xlsx'),
): Promise<GeneratedWorkbook> {
  if (!Number.isInteger(request.year) || request.year < 1900 || request.year > 9999) {
    throw new Error('Année invalide.');
  }
  if (!Array.isArray(request.days)) {
    throw new Error('Le calendrier exporté est invalide.');
  }

  const daysByDate = new Map<string, ExportCalendarDay>();
  for (const day of request.days) {
    if (!day || !isValidIsoDate(day.date, request.year) || !Number.isFinite(day.effectiveHours)) {
      throw new Error('Une journée du calendrier contient des données invalides.');
    }
    daysByDate.set(day.date, day);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  const worksheet = workbook.getWorksheet('Feuil1');
  if (!worksheet) throw new Error('La feuille Feuil1 est absente du modèle Excel.');

  for (let month = 0; month < 12; month += 1) {
    const headerRow = MONTH_START_ROWS[month];
    const weekdayRow = headerRow + 1;
    const workRow = headerRow + 2;
    const leaveRow = headerRow + 3;
    const daysInMonth = new Date(Date.UTC(request.year, month + 1, 0)).getUTCDate();

    const monthLabelCell = worksheet.getCell(headerRow, 1);
    setCellColors(monthLabelCell, APP_COLORS.weekdayBackground, 'FF111827');
    setCellColors(worksheet.getCell(workRow, 1), APP_COLORS.headerBackground, APP_COLORS.headerText);
    setCellColors(worksheet.getCell(leaveRow, 1), APP_COLORS.headerBackground, APP_COLORS.headerText);

    for (let dayOfMonth = 1; dayOfMonth <= 31; dayOfMonth += 1) {
      const column = FIRST_DAY_COLUMN + dayOfMonth - 1;
      if (column > LAST_DAY_COLUMN) continue;

      const dateCell = worksheet.getCell(headerRow, column);
      const weekdayCell = worksheet.getCell(weekdayRow, column);
      const workCell = worksheet.getCell(workRow, column);
      const leaveCell = worksheet.getCell(leaveRow, column);

      if (dayOfMonth > daysInMonth) {
        dateCell.value = null;
        weekdayCell.value = null;
        workCell.value = null;
        leaveCell.value = null;
        for (const cell of [dateCell, weekdayCell, workCell, leaveCell]) {
          setCellColors(cell, APP_COLORS.weekdayBackground);
        }
        continue;
      }

      const isoDate = `${request.year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
      const date = new Date(`${isoDate}T00:00:00.000Z`);
      const dayData = daysByDate.get(isoDate);

      dateCell.value = dayOfMonth;
      weekdayCell.value = WEEKDAY_LABELS[date.getUTCDay()];
      workCell.value = dayData && dayData.effectiveHours !== 0 ? dayData.effectiveHours : null;
      leaveCell.value = dayData && (dayData.isCp || dayData.isRtt) ? 1 : null;

      setHeaderColors(dateCell, dayData);
      setHeaderColors(weekdayCell, dayData);
      setCalendarBodyColors(workCell, dayData);
      setCalendarBodyColors(leaveCell, dayData);
    }

    const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
      const date = `${request.year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
      return daysByDate.get(date);
    });
    const monthWorkTotal = monthDays.reduce((total, day) => total + (day?.effectiveHours || 0), 0);
    const monthLeaveTotal = monthDays.filter((day) => day?.isCp || day?.isRtt).length;
    const workTotalCell = worksheet.getCell(workRow, 35); // AI
    const leaveTotalCell = worksheet.getCell(leaveRow, 35); // AI
    workTotalCell.value = { formula: `SUM(B${workRow}:AF${workRow})`, result: monthWorkTotal };
    leaveTotalCell.value = { formula: `SUM(B${leaveRow}:AF${leaveRow})`, result: monthLeaveTotal };
  }

  const workTotalRows = MONTH_START_ROWS.map((row) => row + 2);
  const leaveTotalRows = MONTH_START_ROWS.map((row) => row + 3);
  const annualWorkTotal = [...daysByDate.values()].reduce((total, day) => total + day.effectiveHours, 0);
  const annualLeaveTotal = [...daysByDate.values()].filter((day) => day.isCp || day.isRtt).length;
  const annualWorkCell = worksheet.getCell('AL58');
  const annualLeaveCell = worksheet.getCell('AL59');
  annualWorkCell.value = {
    formula: `SUM(${workTotalRows.map((row) => `AI${row}`).join(',')})`,
    result: annualWorkTotal,
  };
  annualLeaveCell.value = {
    formula: `SUM(${leaveTotalRows.map((row) => `AI${row}`).join(',')})`,
    result: annualLeaveTotal,
  };

  workbook.calcProperties.fullCalcOnLoad = true;

  const filename = `Planing_${request.year}_${safeProfileName(request.profile)}.xlsx`;
  return { buffer: await workbook.xlsx.writeBuffer(), filename };
}