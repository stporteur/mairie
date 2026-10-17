import type { ReactNode } from 'react';
import { CUSTOM_PROFILE, type LeaveProfiles, type LeaveSettingKey, type LeaveSettings, type SelectedLeaveProfile } from '@/domain/settings/types';
import LeaveProfileSelector from './LeaveProfileSelector';
import LeaveSettingsFields from './LeaveSettingsFields';

interface LeaveSettingsPanelProps {
  /** Distinguishes the radio group and its accessible name between pages. */
  profileGroupName: string;
  profileAriaLabel: string;
  settings: LeaveSettings;
  profile: SelectedLeaveProfile;
  profiles: LeaveProfiles;
  onProfileChange: (profile: SelectedLeaveProfile) => void;
  onSettingChange: (setting: LeaveSettingKey, value: string) => void;
  onSettingBlur?: (setting: LeaveSettingKey) => void;
  /** Page-specific content shown under the fields (help text, errors, actions). */
  children?: ReactNode;
}

/** The "Paramètres" card shared by the planning and forecast pages. */
function LeaveSettingsPanel({
  profileGroupName, profileAriaLabel, settings, profile, profiles, onProfileChange, onSettingChange, onSettingBlur, children,
}: LeaveSettingsPanelProps) {
  return (
    <div className="card">
      <h2>Paramètres</h2>
      <LeaveProfileSelector name={profileGroupName} ariaLabel={profileAriaLabel} selected={profile} profiles={profiles} onChange={onProfileChange} />
      {profile === CUSTOM_PROFILE ? <LeaveSettingsFields settings={settings} onChange={onSettingChange} onBlur={onSettingBlur} /> : null}
      {children}
    </div>
  );
}

export default LeaveSettingsPanel;
