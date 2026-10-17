import { useState } from 'react';
import type { ForecastSummaryRow } from '@shared/types/forecast';
import type { LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import { createCalculateForecast } from '@/handlers/forecast/calculateForecast';
import { createExportForecast } from '@/handlers/forecast/exportForecast';
import { useLeaveSettingsForm } from './useLeaveSettingsForm';
import { useServices } from './useServices';

interface ForecastPageOptions {
  startYear: number;
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
}

export function useForecastPage({ startYear, initialSettings, initialProfile }: ForecastPageOptions) {
  const services = useServices();
  const [rows, setRows] = useState<ForecastSummaryRow[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const form = useLeaveSettingsForm({
    initialSettings,
    initialProfile,
    clearError: () => setError(''),
  });

  return {
    startYear,
    rows,
    calculating,
    progress,
    error,
    exporting,
    settings: form.settings,
    profile: form.profile,
    onSettingChange: form.changeSetting,
    onProfileChange: form.changeProfile,
    onCalculate: createCalculateForecast({
      startYear,
      settings: form.settings,
      profile: form.profile,
      setSettings: form.setSettings,
      setRows,
      setCalculating,
      setProgress,
      setError,
      services,
    }),
    onExport: createExportForecast({
      startYear,
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
