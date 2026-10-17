import { useContext } from 'react';
import { PlanningContext } from './PlanningContext';

export function usePlanning() {
  const model = useContext(PlanningContext);
  if (!model) throw new Error('usePlanning must be used inside <PlanningProvider>.');
  return model;
}
