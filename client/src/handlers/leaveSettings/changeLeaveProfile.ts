import { applyProfileToSettings } from '@/domain/settings/leaveProfiles';
import type { LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import type { StateSetter } from '../types';

export interface ChangeLeaveProfileDeps {
  profiles: LeaveProfiles;
  setSettings: StateSetter<LeaveSettings>;
  setProfile: StateSetter<SelectedLeaveProfile>;
  clearError: () => void;
}

export function createChangeLeaveProfile({ profiles, setSettings, setProfile, clearError }: ChangeLeaveProfileDeps) {
  return (profile: SelectedLeaveProfile): void => {
    setProfile(profile);
    setSettings((current) => applyProfileToSettings(profiles, current, profile));
    clearError();
  };
}
