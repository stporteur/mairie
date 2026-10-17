import { DEFAULT_YEAR } from '@/config/constants';
import type { StateSetter } from '../types';

export function createChangeYear(deps: { setYear: StateSetter<number> }) {
  return (value: string): void => deps.setYear(Number(value) || DEFAULT_YEAR);
}
