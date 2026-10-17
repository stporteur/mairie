import { createContext } from 'react';
import type { PlanningPageModel } from './usePlanningPage';

/** Planning state shared by every page that depends on the year and leave settings. */
export const PlanningContext = createContext<PlanningPageModel | null>(null);
