import type { LeaveSettingKey } from '@/domain/settings/types';

export interface ChangePlanningSettingDeps {
  changeLeaveSetting: (setting: LeaveSettingKey, value: string) => void;
  clearError: () => void;
}

/** Editing the school hours dismisses the previous validation error. */
export function createChangePlanningSetting({ changeLeaveSetting, clearError }: ChangePlanningSettingDeps) {
  return (setting: LeaveSettingKey, value: string): void => {
    changeLeaveSetting(setting, value);
    if (setting === 'schoolWeeklyHours') clearError();
  };
}
