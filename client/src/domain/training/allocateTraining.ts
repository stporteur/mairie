import type { AllocatedCalendarDay, TrainingCalendarDay } from '../calendar/types';

function roundHours(value: number): number {
  return Number(value.toFixed(2));
}

/** Spreads each month's training hours evenly over its free workdays; the last day absorbs rounding. */
export function allocateTraining(
  calendar: AllocatedCalendarDay[],
  trainingByMonth: number[],
): TrainingCalendarDay[] {
  const enriched = calendar.map((day) => ({ ...day, trainingHours: 0 }));

  trainingByMonth.forEach((_, monthIndex) => {
    const total = Number(trainingByMonth[monthIndex] || 0);
    const workdays = enriched.filter(
      (day) => day.month === monthIndex && day.isWorkday && !day.isCp && !day.isRtt,
    );
    if (!workdays.length || total <= 0) return;

    const perDay = roundHours(total / workdays.length);
    let assigned = 0;

    workdays.forEach((day, index) => {
      if (index === workdays.length - 1) {
        day.trainingHours = roundHours(total - assigned);
      } else {
        day.trainingHours = perDay;
        assigned += perDay;
      }
    });
  });

  return enriched;
}
