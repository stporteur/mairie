import { useEffect, useState } from 'react';
import type { ForecastSummaryRow } from '@shared/types/forecast';
import { applyProfileToSettings } from '@/domain/settings/leaveProfiles';
import { CUSTOM_PROFILE, NO_PROFILE, type LeaveProfiles, type LeaveSettings, type SelectedLeaveProfile } from '@/domain/settings/types';
import { createCalculateForecast } from '@/handlers/forecast/calculateForecast';
import { createExportForecast } from '@/handlers/forecast/exportForecast';
import { useLeaveSettingsForm } from './useLeaveSettingsForm';
import { useServices } from './useServices';

interface ForecastPageOptions {
  startYear: number;
  yearCount: number;
  profiles: LeaveProfiles;
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
}

export function useForecastPage({ startYear, yearCount, profiles, initialSettings, initialProfile }: ForecastPageOptions) {
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
    yearCount,
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

  // Previous results no longer match the requested period: drop them and rerun a catalog profile.
  useEffect(() => {
    setRows([]);
    if (form.profile !== NO_PROFILE && form.profile !== CUSTOM_PROFILE) {
      void calculateFor(form.settings, form.profile)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startYear, yearCount]);

  const changeProfile = (selected: SelectedLeaveProfile): void => {
    form.changeProfile(selected);
    if (selected === CUSTOM_PROFILE) return;
    // An existing profile is applied right away; only Custom waits for « Calculer ».
    void calculateFor(applyProfileToSettings(profiles, form.settings, selected), selected)();
  };

  const exportDeps = {
    startYear,
    profiles,
    profile: form.profile,
    rows,
    exporting,
    setExporting,
    setError,
    services,
  };

  return {
    startYear,
    yearCount,
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
    onExport: createExportForecast(exportDeps),
    onExportPdf: createExportForecast(exportDeps, 'pdf'),
  };
}

export type ForecastPageModel = ReturnType<typeof useForecastPage>;
