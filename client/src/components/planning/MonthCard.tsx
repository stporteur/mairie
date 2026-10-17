import { monthNames } from '@/config/constants';
import type { TrainingCalendarDay } from '@/domain/calendar/types';
import { getCalendarCellClass, getDayHeaderClass, getWeekdayInitial } from '@/presentation/calendarStyles';

interface MonthCardProps {
  monthIndex: number;
  days: TrainingCalendarDay[];
}

function MonthCard({ monthIndex, days }: MonthCardProps) {
  return (
    <div className="month-card">
      <h3>{monthNames[monthIndex]}</h3>
      <div className="month-table-wrapper">
        <table className="month-calendar">
          <thead>
            <tr>
              <th rowSpan={2} aria-label="Jour" title="Jour">J</th>
              {days.map((day) => (
                <th key={`${day.date}-initial`} className={getDayHeaderClass(day)}>{getWeekdayInitial(day.date)}</th>
              ))}
            </tr>
            <tr>
              {days.map((day) => (
                <th key={`${day.date}-number`} className={getDayHeaderClass(day)}>{Number(day.date.slice(-2))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th aria-label="Heures travail" title="Heures travail">T</th>
              {days.map((day) => (
                <td key={`${day.date}-work`} className={getCalendarCellClass(day)}>{day.effectiveHours ? day.effectiveHours.toFixed(2) : '-'}</td>
              ))}
            </tr>
            <tr>
              <th aria-label="Congés" title="Congés">C</th>
              {days.map((day) => (
                <td key={`${day.date}-leave`} className={getCalendarCellClass(day)}>{day.isCp ? 'CP' : day.isRtt ? 'RTT' : ''}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MonthCard;
