import type { LeaveSettings, SelectedLeaveProfile } from '@/domain/settings/types';
import { useForecastPage } from '@/hooks/useForecastPage';
import ForecastView from './ForecastView';

interface ForecastPageProps {
  startYear: number;
  initialSettings: LeaveSettings;
  initialProfile: SelectedLeaveProfile;
}

/** Remounted by the parent (via `key`) whenever the starting point changes. */
function ForecastPage(props: ForecastPageProps) {
  return <ForecastView model={useForecastPage(props)} />;
}

export default ForecastPage;
