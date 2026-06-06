import { getPentecostMonday } from '../utils/date';
import { findVacationPeriods } from './vacations';
import { VACATION_KEYWORDS } from '../utils/constants';

// Allocate leave days (CP and RTT) based on vacation periods
export function allocateLeave(calendar, vacations) {
  const cpDates = new Set();
  const rttDates = new Set();

  function allocateDays(periods, count) {
    const allocations = [];
    periods.forEach((period) => {
      const candidates = calendar.filter(
        (day) =>
          day.month !== 0 &&
          day.date >= period.start &&
          day.date <= period.end &&
          day.isWorkday &&
          !cpDates.has(day.date) &&
          !rttDates.has(day.date),
      );
      for (let i = 0; i < Math.min(count, candidates.length); i += 1) {
        allocations.push(candidates[i].date);
      }
    });
    return allocations;
  }

  const smallVacations = findVacationPeriods(vacations, VACATION_KEYWORDS.SMALL);
  const summerVacations = findVacationPeriods(vacations, VACATION_KEYWORDS.SUMMER);

  const smallAllocation = allocateDays(smallVacations, 5);
  smallAllocation.forEach((date) => cpDates.add(date));

  const summerAllocation = allocateDays(summerVacations, 5);
  summerAllocation.forEach((date) => cpDates.add(date));

  const year = calendar.length ? Number(calendar[0].date.slice(0, 4)) : null;
  if (year) {
    const pentecostMondayDate = getPentecostMonday(year);
    if (pentecostMondayDate && !cpDates.has(pentecostMondayDate)) {
      rttDates.add(pentecostMondayDate);
    }
  }

  const summerVacationDates = new Set(
    calendar
      .filter((day) =>
        summerVacations.some(
          (period) => day.date >= period.start && day.date <= period.end,
        ),
      )
      .map((day) => day.date),
  );

  const summerCpDates = new Set(
    calendar
      .filter(
        (day) =>
          cpDates.has(day.date) &&
          summerVacationDates.has(day.date),
      )
      .map((day) => day.date),
  );

  const remainingRttCandidates = calendar
    .filter(
      (day) =>
        day.inVacation &&
        day.isWorkday &&
        !cpDates.has(day.date) &&
        !rttDates.has(day.date),
    )
    .map((day) => {
      const minDistanceToSummerCp = [...summerCpDates].reduce((min, cpDate) => {
        const distance = Math.abs(
          new Date(day.date).getTime() - new Date(cpDate).getTime(),
        );
        return Math.min(min, distance);
      }, Infinity);
      return {
        day,
        priority:
          summerVacationDates.has(day.date) && summerCpDates.size > 0
            ? minDistanceToSummerCp
            : Infinity,
      };
    })
    .sort((a, b) => a.priority - b.priority)
    .map((entry) => entry.day);

  const remainingRttCount = 9 - rttDates.size;
  remainingRttCandidates.slice(0, remainingRttCount).forEach((day) => rttDates.add(day.date));

  const remainingCpCount = 25 - cpDates.size;
  if (remainingCpCount > 0) {
    const extraCandidates = calendar.filter(
      (day) =>
        day.inVacation &&
        day.isWorkday &&
        !cpDates.has(day.date) &&
        !rttDates.has(day.date),
    );
    extraCandidates.slice(0, remainingCpCount).forEach((day) => cpDates.add(day.date));
  }

  const allDates = calendar.map((day) => ({
    ...day,
    isCp: cpDates.has(day.date),
    isRtt: rttDates.has(day.date),
    effectiveHours: cpDates.has(day.date) || rttDates.has(day.date) ? 0 : day.defaultHours,
  }));

  return {
    calendar: allDates,
    cpDates,
    rttDates,
  };
}