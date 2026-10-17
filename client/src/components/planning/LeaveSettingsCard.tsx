import Alert from '../common/Alert';
import LeaveSettingsPanel from '../common/LeaveSettingsPanel';
import type { LeaveProfiles, LeaveSettingKey, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';

interface LeaveSettingsCardProps {
  settings: LeaveSettings;
  profile: SelectedLeaveProfile;
  profiles: LeaveProfiles;
  error: string;
  onProfileChange: (profile: SelectedLeaveProfile) => void;
  onSettingChange: (setting: LeaveSettingKey, value: string) => void;
  onSettingBlur: (setting: LeaveSettingKey) => void;
  onCalculate: () => void;
}

function LeaveSettingsCard({
  settings, profile, profiles, error, onProfileChange, onSettingChange, onSettingBlur, onCalculate,
}: LeaveSettingsCardProps) {
  return (
    <LeaveSettingsPanel
      profileGroupName="leave-profile"
      profileAriaLabel="Profils horaires"
      settings={settings}
      profile={profile}
      profiles={profiles}
      onProfileChange={onProfileChange}
      onSettingChange={onSettingChange}
      onSettingBlur={onSettingBlur}
    >
      <p className="help-text">Les paramètres sont appliqués au calendrier uniquement après clic sur « Calculer ».</p>
      {error ? <Alert role="alert">{error}</Alert> : null}
      <button className="primary-button calculate-button" type="button" onClick={onCalculate}>Calculer</button>
    </LeaveSettingsPanel>
  );
}

export default LeaveSettingsCard;
