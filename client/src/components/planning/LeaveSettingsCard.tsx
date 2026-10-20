import { maxSupportedYear, minSupportedYear } from '@/config/years';
import Alert from '../common/Alert';
import LeaveSettingsPanel from '../common/LeaveSettingsPanel';
import { CUSTOM_PROFILE, type LeaveProfiles, LeaveSettingKey, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';

interface LeaveSettingsCardProps {
  year: number;
  settings: LeaveSettings;
  profile: SelectedLeaveProfile;
  profiles: LeaveProfiles;
  error: string;
  onYearChange: (value: string) => void;
  onProfileChange: (profile: SelectedLeaveProfile) => void;
  onSettingChange: (setting: LeaveSettingKey, value: string) => void;
  onSettingBlur: (setting: LeaveSettingKey) => void;
  onCalculate: () => void;
}

function LeaveSettingsCard({
  year, settings, profile, profiles, error, onYearChange, onProfileChange, onSettingChange, onSettingBlur, onCalculate,
}: LeaveSettingsCardProps) {
  const isCustom = profile === CUSTOM_PROFILE;

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
      <div className="field-row">
        <label>
          Année
          <input type="number" min={minSupportedYear()} max={maxSupportedYear()} value={year} onChange={(event) => onYearChange(event.target.value)} />
        </label>
      </div>
      {isCustom ? <p className="help-text">Les paramètres personnalisés sont appliqués au calendrier après clic sur « Calculer ».</p> : null}
      {error ? <Alert role="alert">{error}</Alert> : null}
      {isCustom ? <button className="primary-button calculate-button" type="button" onClick={onCalculate}>Calculer</button> : null}
    </LeaveSettingsPanel>
  );
}

export default LeaveSettingsCard;
