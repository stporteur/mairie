import type { LeaveSettingKey, LeaveSettings } from '@/domain/settings/types';

interface LeaveSettingsFieldsProps {
  settings: LeaveSettings;
  onChange: (setting: LeaveSettingKey, value: string) => void;
  onBlur?: (setting: LeaveSettingKey) => void;
}

const FIELDS: { key: LeaveSettingKey; label: string; step: string }[] = [
  { key: 'cpDays', label: 'Jours de CP', step: '1' },
  { key: 'rttDays', label: 'Jours de RTT', step: '1' },
  { key: 'schoolWeeklyHours', label: 'Heures/semaine Scolaire', step: '0.25' },
  { key: 'vacationWeeklyHours', label: 'Heures/semaine Vacances', step: '0.25' },
];

function LeaveSettingsFields({ settings, onChange, onBlur }: LeaveSettingsFieldsProps) {
  return (
    <div className="month-grid leave-settings-grid">
      {FIELDS.map(({ key, label, step }) => (
        <label key={key} className="month-input">
          <span>{label}</span>
          <input
            type="number"
            min="0"
            step={step}
            value={settings[key]}
            onChange={(event) => onChange(key, event.target.value)}
            onBlur={onBlur ? () => onBlur(key) : undefined}
          />
        </label>
      ))}
    </div>
  );
}

export default LeaveSettingsFields;
