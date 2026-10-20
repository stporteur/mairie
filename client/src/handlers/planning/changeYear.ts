import { currentYear } from '@/config/years';
import type { StateSetter } from '../types';

export function createChangeYear(deps: { setYear: StateSetter<number> }) {
  return (value: string): void => deps.setYear(Number(value) || currentYear());
}
