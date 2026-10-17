import { describeWeekdays, parseWeekdays, toggleWeekday, WEEKDAYS } from '@/domain/parameters/weekdays';

interface WeekdaysPickerProps {
  label: string;
  /** Comma-joined days, e.g. "lundi,mercredi". */
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** Drop-down summarising the selected days, opening a list of one checkbox per weekday. */
function WeekdaysPicker({ label, value, disabled, onChange }: WeekdaysPickerProps) {
  const selected = parseWeekdays(value);

  return (
    <div className="month-input weekdays-picker">
      <span>{label}</span>
      <details className={disabled ? 'weekdays-combobox is-disabled' : 'weekdays-combobox'} onClick={disabled ? (event) => event.preventDefault() : undefined}>
        <summary aria-label={label}>{describeWeekdays(value)}</summary>
        <div className="weekdays-options" role="group" aria-label={label}>
          {WEEKDAYS.map((day) => (
            <label key={day.value}>
              <input
                type="checkbox"
                checked={selected.includes(day.value)}
                disabled={disabled}
                onChange={(event) => onChange(toggleWeekday(value, day.value, event.target.checked))}
              />
              {day.label}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}

export default WeekdaysPicker;
