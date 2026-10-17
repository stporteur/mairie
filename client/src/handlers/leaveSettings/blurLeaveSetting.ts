import { normalizeSettingValue } from '@/domain/settings/normalize';
import type { LeaveSettingKey, LeaveSettings } from '@/domain/settings/types';
import type { StateSetter } from '../types';

export interface BlurLeaveSettingDeps {
  settings: LeaveSettings;
  setSettings: StateSetter<LeaveSettings>;
}

export function createBlurLeaveSetting({ settings, setSettings }: BlurLeaveSettingDeps) {
  return (setting: LeaveSettingKey): void => {
    if (setting === 'schoolWeeklyHours' || settings[setting] === '') return;
    setSettings((current) => ({ ...current, [setting]: normalizeSettingValue(setting, current[setting]) }));
  };
}
