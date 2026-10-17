import { CUSTOM_PROFILE } from '@/domain/settings/types';
import type { LeaveProfiles, SelectedLeaveProfile } from '@/domain/settings/types';

interface LeaveProfileSelectorProps {
  name: string;
  ariaLabel: string;
  selected: SelectedLeaveProfile;
  profiles: LeaveProfiles;
  onChange: (profile: SelectedLeaveProfile) => void;
}

function LeaveProfileSelector({ name, ariaLabel, selected, profiles, onChange }: LeaveProfileSelectorProps) {
  return (
    <fieldset className="leave-profile-options" aria-label={ariaLabel}>
      {profiles.map((profile) => (
        <label key={profile.key} className="leave-profile-option">
          <input type="radio" name={name} value={profile.key} checked={selected === profile.key} onChange={() => onChange(profile.key)} />
          <span>
            <strong>{profile.label}</strong>
            <small>{profile.rttDays} jours RTT · {profile.vacationWeeklyHours} h vacances · {profile.schoolWeeklyHours} h scolaire</small>
          </span>
        </label>
      ))}
      <label className="leave-profile-option">
        <input type="radio" name={name} value={CUSTOM_PROFILE} checked={selected === CUSTOM_PROFILE} onChange={() => onChange(CUSTOM_PROFILE)} />
        <span><strong>Custom</strong></span>
      </label>
    </fieldset>
  );
}

export default LeaveProfileSelector;
