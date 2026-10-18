import { useEffect, useMemo, useState } from 'react';
import type { VacationPeriod, VacationSource } from '@shared/types/vacations';
import { computeYearPlan } from '@/application/computeYearPlan';
import { loadLeaveState } from '@/application/loadLeaveState';
import { DEFAULT_YEAR } from '@/config/constants';
import { getAnnualWarnings, summarizeYear } from '@/domain/summary/annualSummary';
import { groupByMonth, summarizeMonths } from '@/domain/summary/monthlySummary';
import { toLeaveParameters } from '@/domain/settings/normalize';
import { applyProfileToSettings, getPlanning } from '@/domain/settings/leaveProfiles';
import { CUSTOM_PROFILE, NO_PROFILE } from '@/domain/settings/types';
import type { LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import { createCalculatePlanning } from '@/handlers/planning/calculatePlanning';
import { createChangePlanningSetting } from '@/handlers/planning/changePlanningSetting';
import { createChangeYear } from '@/handlers/planning/changeYear';
import { createEditVacationPeriod } from '@/handlers/planning/editVacationPeriod';
import { createExportPlanning } from '@/handlers/planning/exportPlanning';
import { createLoadVacations } from '@/handlers/vacations/loadVacations';
import { useLeaveSettingsForm } from './useLeaveSettingsForm';
import { useServices } from './useServices';

const NO_TRAINING_HOURS: number[] = Array.from({ length: 12 }, () => 0);

export function usePlanningPage(profiles: LeaveProfiles) {
  const services = useServices();
  const [initial] = useState(() => loadLeaveState(services.preferences));
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [vacationSource, setVacationSource] = useState<VacationSource | null>(null);
  const [appliedSettings, setAppliedSettings] = useState<LeaveSettings>(initial.appliedSettings);
  const [appliedProfile, setAppliedProfile] = useState<SelectedLeaveProfile>(initial.appliedProfile);
  const [calculationError, setCalculationError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const form = useLeaveSettingsForm({
    profiles,
    initialSettings: initial.draftSettings,
    initialProfile: initial.selectedProfile,
    clearError: () => setCalculationError(''),
  });

  const planning = getPlanning(profiles, appliedProfile);
  const parameters = toLeaveParameters(appliedSettings, planning);
  const { cpQuota, rttQuota, schoolWeeklyHours, vacationWeeklyHours } = parameters;

  useEffect(() => {
    services.preferences.writeSettings({ cpDays: cpQuota, rttDays: rttQuota, schoolWeeklyHours, vacationWeeklyHours });
  }, [services, cpQuota, rttQuota, schoolWeeklyHours, vacationWeeklyHours]);
  useEffect(() => {
    createLoadVacations({ gateway: services.vacations, setVacations, setSource: setVacationSource })(year);
  }, [services, year]);

  const hasProfile = appliedProfile !== NO_PROFILE;
  const calendar = useMemo(
    () => (hasProfile ? computeYearPlan(
      year,
      vacations,
      { cpQuota, rttQuota, schoolWeeklyHours, vacationWeeklyHours, planning },
      NO_TRAINING_HOURS,
      services.holidays,
    ) : null) ?? [],
    [services, year, vacations, hasProfile, cpQuota, rttQuota, schoolWeeklyHours, vacationWeeklyHours, planning],
  );

  const summary = summarizeYear(calendar, NO_TRAINING_HOURS);
  const expectedLeave = cpQuota + rttQuota;
  const exportDeps = {
    year,
    profiles,
    profile: form.profile,
    settings: appliedSettings,
    calendar,
    exporting,
    setExporting,
    setError: setExportError,
    services,
  };

  return {
    year,
    vacations,
    vacationSource,
    settings: form.settings,
    profile: form.profile,
    profiles,
    calculationError,
    exporting,
    exportError,
    summary,
    expectedLeave,
    warnings: getAnnualWarnings(summary, expectedLeave),
    monthlyCalendars: groupByMonth(calendar),
    monthlySummaries: calendar.length ? summarizeMonths(calendar) : [],
    canExport: calendar.length > 0 && !exporting,
    onYearChange: createChangeYear({ setYear }),
    onVacationChange: createEditVacationPeriod({ setVacations }),
    onProfileChange: (selected: SelectedLeaveProfile) => {
      form.changeProfile(selected);
      if (selected === CUSTOM_PROFILE) return;
      // An existing profile is applied right away; only Custom waits for « Calculer ».
      createCalculatePlanning({
        settings: applyProfileToSettings(profiles, form.settings, selected),
        profile: selected,
        setSettings: form.setSettings,
        setAppliedSettings,
        setAppliedProfile,
        setError: setCalculationError,
      })();
    },
    onSettingChange: createChangePlanningSetting({
      changeLeaveSetting: form.changeSetting,
      clearError: () => setCalculationError(''),
    }),
    onSettingBlur: form.blurSetting,
    onResetProfile: () => {
      form.setProfile(NO_PROFILE);
      setAppliedProfile(NO_PROFILE);
      setCalculationError('');
    },
    onCalculate: createCalculatePlanning({
      settings: form.settings,
      profile: form.profile,
      setSettings: form.setSettings,
      setAppliedSettings,
      setAppliedProfile,
      setError: setCalculationError,
    }),
    onExport: createExportPlanning(exportDeps),
    onExportPdf: createExportPlanning(exportDeps, 'pdf'),
  };
}

export type PlanningPageModel = ReturnType<typeof usePlanningPage>;
