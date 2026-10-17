import type { PlanningTypeCode } from '@shared/types/parameters';
import { AtsemPlanningStrategy } from './strategies/AtsemPlanningStrategy';
import { StandardPlanningStrategy } from './strategies/StandardPlanningStrategy';
import type { PlanningDescriptor, PlanningStrategy, WeeklyHours } from './types';

type StrategyFactory = (descriptor: PlanningDescriptor, hours: WeeklyHours) => PlanningStrategy;

/** One entry per planning type: adding a type means adding its strategy here. */
const STRATEGY_FACTORIES: Record<PlanningTypeCode, StrategyFactory> = {
  STANDARD: (_descriptor, hours) => new StandardPlanningStrategy(hours),
  ATSEM: (descriptor, hours) => new AtsemPlanningStrategy(descriptor, hours),
};

/** Used by the free-values (Custom) profile: an ATSEM week resting on Wednesdays during the school period. */
export const DEFAULT_PLANNING: PlanningDescriptor = { type: 'ATSEM', schoolRestDays: [3], vacationRestDays: [] };

export function createPlanningStrategy(descriptor: PlanningDescriptor, hours: WeeklyHours): PlanningStrategy {
  return STRATEGY_FACTORIES[descriptor.type](descriptor, hours);
}
