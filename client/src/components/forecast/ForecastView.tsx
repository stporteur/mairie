import { useState } from 'react';
import type { ForecastComparisonModel } from '@/hooks/useForecastComparison';
import type { ForecastPageModel } from '@/hooks/useForecastPage';
import ForecastComparison from './ForecastComparison';
import ForecastDetails from './ForecastDetails';
import ForecastModeSelector, { type ForecastMode } from './ForecastModeSelector';

interface ForecastViewProps {
  model: ForecastPageModel;
  comparison: ForecastComparisonModel;
}

function ForecastView({ model, comparison }: ForecastViewProps) {
  const [mode, setMode] = useState<ForecastMode>('details');

  return (
    <>
      <ForecastModeSelector mode={mode} onChange={setMode} />
      {mode === 'details' ? <ForecastDetails model={model} /> : <ForecastComparison model={comparison} />}
    </>
  );
}

export default ForecastView;
