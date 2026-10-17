import { applyProfileToSettings } from '@/domain/settings/leaveProfiles';
import type { LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import type { StateSetter } from '../types';

export interface ChangeLeaveProfileDeps {
  setSettings: StateSetter<LeaveSettings>;
  setProfile: StateSetter<SelectedLeaveProfile>;
  clearError: () => void;
}

export function createChangeLeaveProfile({ setSettings, setProfile, clearError }: ChangeLeaveProfileDeps) {
  return (profile: SelectedLeaveProfile): void => {
    setProfile(profile);
    setSettings((current) => applyProfileToSettings(current, profile));
    clearError();
  };
}
