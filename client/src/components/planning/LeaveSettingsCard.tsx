import Alert from '../common/Alert';
import LeaveProfileSelector from '../common/LeaveProfileSelector';
import LeaveSettingsFields from '../common/LeaveSettingsFields';
import type { LeaveSettingKey, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';

interface LeaveSettingsCardProps {
  settings: LeaveSettings;
  profile: SelectedLeaveProfile;
  error: string;
  onProfileChange: (profile: SelectedLeaveProfile) => void;
  onSettingChange: (setting: LeaveSettingKey, value: string) => void;
  onSettingBlur: (setting: LeaveSettingKey) => void;
  onCalculate: () => void;
}

function LeaveSettingsCard({
  settings, profile, error, onProfileChange, onSettingChange, onSettingBlur, onCalculate,
}: LeaveSettingsCardProps) {
  return (
    <div className="card">
      <h2>Paramètres</h2>
      <LeaveProfileSelector name="leave-profile" ariaLabel="Profils horaires" selected={profile} onChange={onProfileChange} />
      <LeaveSettingsFields settings={settings} onChange={onSettingChange} onBlur={onSettingBlur} />
      <p className="help-text">Les paramètres sont appliqués au calendrier uniquement après clic sur « Calculer ».</p>
      {error ? <Alert role="alert">{error}</Alert> : null}
      <button className="primary-button calculate-button" type="button" onClick={onCalculate}>Calculer</button>
    </div>
  );
}

export default LeaveSettingsCard;
