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

/** Remounted by the parent (via `key`) whenever the starting point changes. */
function ForecastPage(props: ForecastPageProps) {
  const model = useForecastPage(props);
  const comparison = useForecastComparison({
    startYear: props.startYear,
    profiles: props.profiles,
    settings: props.initialSettings,
  });
  return <ForecastView model={model} comparison={comparison} />;
}

export default ForecastPage;
