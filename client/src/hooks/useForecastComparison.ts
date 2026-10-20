import { useEffect, useState } from 'react';
import type { ForecastSummaryRow } from '@shared/types/forecast';
import { computeForecast } from '@/application/computeForecast';
import { applyProfileToSettings, getPlanning } from '@/domain/settings/leaveProfiles';
import { toLeaveParameters } from '@/domain/settings/normalize';
import { forecastComparisonFilename } from '@/domain/export/filenames';
import { describeProfileLeave } from '@/presentation/profileDescription';
import type { LeaveProfiles, LeaveSettings } from '@/domain/settings/types';
import { useServices } from './useServices';

interface ForecastComparisonOptions {
  startYear: number;
  yearCount: number;
  profiles: LeaveProfiles;
  /** Source of the values that profiles do not carry (CP). */
  settings: LeaveSettings;
}

export function useForecastComparison({ startYear, yearCount, profiles, settings }: ForecastComparisonOptions) {
  const services = useServices();
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, ForecastSummaryRow[]>>({});
  const [loading, setLoading] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const exportedProfiles = profiles
    .filter((profile) => selected.includes(profile.key) && results[profile.key])
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));

  const exportComparison = async (format: 'xlsx' | 'pdf' = 'xlsx'): Promise<void> => {
    if (exportedProfiles.length === 0 || exporting) return;
    setExporting(true);
    setError('');
    try {
      const file = await services.exports.exportForecastComparison({
        startYear,
        profiles: exportedProfiles.map((profile) => ({
          label: profile.label,
          description: describeProfileLeave(profile, settings.cpDays),
          rows: results[profile.key],
        })),
      }, format);
      services.downloader.download(file, forecastComparisonFilename(startYear, format));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Impossible d’exporter le comparatif.');
    } finally {
      setExporting(false);
    }
  };

  const compute = async (key: string): Promise<void> => {
    setLoading((current) => [...current, key]);
    try {
      const parameters = toLeaveParameters(applyProfileToSettings(profiles, settings, key), getPlanning(profiles, key));
      const rows = await computeForecast({ startYear, yearCount, parameters }, services);
      setResults((current) => ({ ...current, [key]: rows }));
    } catch (failure) {
      setSelected((current) => current.filter((item) => item !== key));
      setError(failure instanceof Error ? failure.message : 'Impossible de calculer le prévisionnel.');
    } finally {
      setLoading((current) => current.filter((item) => item !== key));
    }
  };

  // Results computed for another period are discarded and the selected profiles recomputed.
  useEffect(() => {
    setResults({});
    selected.forEach((key) => void compute(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startYear, yearCount]);

  const toggleProfile = (key: string, checked: boolean): void => {
    setError('');
    if (!checked) {
      setSelected((current) => current.filter((item) => item !== key));
      return;
    }
    setSelected((current) => (current.includes(key) ? current : [...current, key]));
    if (!results[key]) void compute(key);
  };

  return {
    startYear,
    yearCount,
    profiles,
    cpDays: settings.cpDays,
    selected,
    results,
    loading: loading.length > 0,
    exporting,
    canExport: exportedProfiles.length > 0,
    error,
    onExport: () => exportComparison('xlsx'),
    onExportPdf: () => exportComparison('pdf'),
    onToggleProfile: toggleProfile,
  };
}

export type ForecastComparisonModel = ReturnType<typeof useForecastComparison>;
