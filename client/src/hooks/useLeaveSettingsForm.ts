import { useState } from 'react';
import type { LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import { createBlurLeaveSetting } from '@/handlers/leaveSettings/blurLeaveSetting';
import { createChangeLeaveProfile } from '@/handlers/leaveSettings/changeLeaveProfile';
import { createChangeLeaveSetting } from '@/handlers/leaveSettings/changeLeaveSetting';

interface LeaveSettingsFormOptions {
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
  clearError: () => void;
}

/** Draft leave settings and profile edited by the user, shared by both pages. */
export function useLeaveSettingsForm({ initialSettings, initialProfile, clearError }: LeaveSettingsFormOptions) {
  const [settings, setSettings] = useState<LeaveSettings>(() => ({ ...initialSettings }));
  const [profile, setProfile] = useState<SelectedLeaveProfile>(initialProfile);

  return {
    settings,
    profile,
    setSettings,
    changeSetting: createChangeLeaveSetting({ setSettings, setProfile }),
    changeProfile: createChangeLeaveProfile({ setSettings, setProfile, clearError }),
    blurSetting: createBlurLeaveSetting({ settings, setSettings }),
  };
}
