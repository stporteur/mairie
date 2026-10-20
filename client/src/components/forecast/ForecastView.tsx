import { useState } from 'react';
import type { ForecastComparisonModel } from '@/hooks/useForecastComparison';
import type { ForecastPageModel } from '@/hooks/useForecastPage';
import ForecastComparison from './ForecastComparison';
import ForecastDetails from './ForecastDetails';
import ForecastModeSelector, { type ForecastMode } from './ForecastModeSelector';

interface ForecastViewProps {
  model: ForecastPageModel;
  comparison: ForecastComparisonModel;
  onStartYearChange: (year: number) => void;
  onYearCountChange: (count: number) => void;
}

function ForecastView({ model, comparison, onStartYearChange, onYearCountChange }: ForecastViewProps) {
  const [mode, setMode] = useState<ForecastMode>('details');

  return (
    <>
      <ForecastModeSelector
        mode={mode}
        onChange={setMode}
        startYear={model.startYear}
        yearCount={model.yearCount}
        onStartYearChange={onStartYearChange}
        onYearCountChange={onYearCountChange}
        disabled={model.calculating || comparison.loading}
      />
      {mode === 'details' ? <ForecastDetails model={model} /> : <ForecastComparison model={comparison} />}
    </>
  );
}

export default ForecastView;
