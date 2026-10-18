import type { LeaveProfiles } from '@/domain/settings/types';
import { describeProfileLeave } from '@/presentation/profileDescription';

interface ForecastProfileCheckboxesProps {
  profiles: LeaveProfiles;
  cpDays: string;
  selected: readonly string[];
  onToggle: (key: string, checked: boolean) => void;
}

function ForecastProfileCheckboxes({ profiles, cpDays, selected, onToggle }: ForecastProfileCheckboxesProps) {
  return (
    <fieldset className="leave-profile-options" aria-label="Profils à comparer">
      {profiles.map((profile) => (
        <label key={profile.key} className="leave-profile-option">
          <input
            type="checkbox"
            value={profile.key}
            checked={selected.includes(profile.key)}
            onChange={(event) => onToggle(profile.key, event.target.checked)}
          />
          <span>
            <strong>{profile.label}</strong>
            <small>{describeProfileLeave(profile, cpDays)}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export default ForecastProfileCheckboxes;
