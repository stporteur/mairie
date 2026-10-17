import { useState } from 'react';
import type { ForecastSummaryRow } from '@shared/types/forecast';
import { applyProfileToSettings } from '@/domain/settings/leaveProfiles';
import { CUSTOM_PROFILE, type LeaveProfiles, type LeaveSettings, type SelectedLeaveProfile } from '@/domain/settings/types';
import { createCalculateForecast } from '@/handlers/forecast/calculateForecast';
import { createExportForecast } from '@/handlers/forecast/exportForecast';
import { useLeaveSettingsForm } from './useLeaveSettingsForm';
import { useServices } from './useServices';

interface ForecastPageOptions {
  startYear: number;
  profiles: LeaveProfiles;
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
}

export function useForecastPage({ startYear, profiles, initialSettings, initialProfile }: ForecastPageOptions) {
  const services = useServices();
  const [rows, setRows] = useState<ForecastSummaryRow[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const form = useLeaveSettingsForm({
    profiles,
    initialSettings,
    initialProfile,
    clearError: () => setError(''),
  });

  const calculateFor = (settings: LeaveSettings, profile: SelectedLeaveProfile) => createCalculateForecast({
    startYear,
    settings,
    profiles,
    profile,
    setSettings: form.setSettings,
    setRows,
    setCalculating,
    setProgress,
    setError,
    services,
  });

  const changeProfile = (selected: SelectedLeaveProfile): void => {
    form.changeProfile(selected);
    if (selected === CUSTOM_PROFILE) return;
    // An existing profile is applied right away; only Custom waits for « Calculer ».
    void calculateFor(applyProfileToSettings(profiles, form.settings, selected), selected)();
  };

  return {
    startYear,
    rows,
    calculating,
    progress,
    error,
    exporting,
    settings: form.settings,
    profile: form.profile,
    profiles,
    onSettingChange: form.changeSetting,
    onProfileChange: changeProfile,
    onCalculate: calculateFor(form.settings, form.profile),
    onExport: createExportForecast({
      startYear,
      profiles,
      profile: form.profile,
      rows,
      exporting,
      setExporting,
      setError,
      services,
    }),
  };
}

export type ForecastPageModel = ReturnType<typeof useForecastPage>;
