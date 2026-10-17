import { LEAVE_PROFILES, PROFILE_KEYS } from '@/domain/settings/leaveProfiles';
import type { SelectedLeaveProfile } from '@/domain/settings/types';

interface LeaveProfileSelectorProps {
  name: string;
  ariaLabel: string;
  selected: SelectedLeaveProfile;
  onChange: (profile: SelectedLeaveProfile) => void;
}

function LeaveProfileSelector({ name, ariaLabel, selected, onChange }: LeaveProfileSelectorProps) {
  return (
    <fieldset className="leave-profile-options" aria-label={ariaLabel}>
      {PROFILE_KEYS.map((key) => {
        const profile = LEAVE_PROFILES[key];
        return (
          <label key={key} className="leave-profile-option">
            <input type="radio" name={name} value={key} checked={selected === key} onChange={() => onChange(key)} />
            <span>
              <strong>{profile.label}</strong>
              <small>{profile.rttDays} jours RTT · {profile.vacationWeeklyHours} h vacances · {profile.schoolWeeklyHours} h scolaire</small>
            </span>
          </label>
        );
      })}
      <label className="leave-profile-option">
        <input type="radio" name={name} value="custom" checked={selected === 'custom'} onChange={() => onChange('custom')} />
        <span><strong>Custom</strong></span>
      </label>
    </fieldset>
  );
}

export default LeaveProfileSelector;
