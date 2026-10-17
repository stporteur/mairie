import { useState } from 'react';
import type { LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import { createBlurLeaveSetting } from '@/handlers/leaveSettings/blurLeaveSetting';
import { createChangeLeaveProfile } from '@/handlers/leaveSettings/changeLeaveProfile';
import { createChangeLeaveSetting } from '@/handlers/leaveSettings/changeLeaveSetting';

interface LeaveSettingsFormOptions {
  profiles: LeaveProfiles;
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
  clearError: () => void;
}

/** Draft leave settings and profile edited by the user, shared by both pages. */
export function useLeaveSettingsForm({ profiles, initialSettings, initialProfile, clearError }: LeaveSettingsFormOptions) {
  const [settings, setSettings] = useState<LeaveSettings>(() => ({ ...initialSettings }));
  const [profile, setProfile] = useState<SelectedLeaveProfile>(initialProfile);

  return {
    settings,
    profile,
    setSettings,
    setProfile,
    changeSetting: createChangeLeaveSetting({ setSettings, setProfile }),
    changeProfile: createChangeLeaveProfile({ profiles, setSettings, setProfile, clearError }),
    blurSetting: createBlurLeaveSetting({ settings, setSettings }),
  };
}
