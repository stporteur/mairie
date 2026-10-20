import { useState } from 'react';
import { FORECAST_YEAR_COUNT } from '@/config/constants';
import { maxSupportedYear } from '@/config/years';
import type { LeaveProfiles, LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import { useForecastComparison } from '@/hooks/useForecastComparison';
import { useForecastPage } from '@/hooks/useForecastPage';
import ForecastView from './ForecastView';

interface ForecastPageProps {
  startYear: number;
  profiles: LeaveProfiles;
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
}

/** Remounted by the parent (via `key`) whenever the planning year changes. */
function ForecastPage(props: ForecastPageProps) {
  const [startYear, setStartYear] = useState(props.startYear);
  const [yearCount, setYearCount] = useState(FORECAST_YEAR_COUNT);
  const changeStartYear = (year: number): void => {
    setStartYear(year);
    setYearCount((count) => Math.min(count, maxSupportedYear() - year + 1));
  };
  const model = useForecastPage({ ...props, startYear, yearCount });
  const comparison = useForecastComparison({
    startYear,
    yearCount,
    profiles: props.profiles,
    settings: props.initialSettings,
  });
  return <ForecastView model={model} comparison={comparison} onStartYearChange={changeStartYear} onYearCountChange={setYearCount} />;
}

export default ForecastPage;
