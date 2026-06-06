// Allocate training hours across workdays
export function allocateTraining(calendar, trainingByMonth) {
  const enriched = calendar.map((day) => ({ ...day, trainingHours: 0 }));

  trainingByMonth.forEach((_, monthIndex) => {
    const total = Number(trainingByMonth[monthIndex] || 0);
    const workdays = enriched.filter(
      (day) => day.month === monthIndex && day.isWorkday && !day.isCp && !day.isRtt,
    );
    if (!workdays.length || total <= 0) {
      return;
    }

    const perDay = Number((total / workdays.length).toFixed(2));
    let assigned = 0;

    workdays.forEach((day, index) => {
      if (index === workdays.length - 1) {
        day.trainingHours = Number((total - assigned).toFixed(2));
      } else {
        day.trainingHours = perDay;
        assigned += perDay;
      }
    });
  });

  return enriched;
}