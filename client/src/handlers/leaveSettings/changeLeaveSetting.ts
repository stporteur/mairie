import type { LeaveSettingKey, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import type { StateSetter } from '../types';

export interface ChangeLeaveSettingDeps {
  setSettings: StateSetter<LeaveSettings>;
  setProfile: StateSetter<SelectedLeaveProfile>;
}

/** Any change other than the CP quota makes the profile custom. */
export function createChangeLeaveSetting({ setSettings, setProfile }: ChangeLeaveSettingDeps) {
  return (setting: LeaveSettingKey, value: string): void => {
    setSettings((current) => ({ ...current, [setting]: value }));
    if (setting !== 'cpDays') setProfile('custom');
  };
}
