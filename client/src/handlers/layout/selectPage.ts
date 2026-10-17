import type { PageName } from '@/config/constants';
import type { StateSetter } from '../types';

export function createSelectPage(deps: { setActivePage: StateSetter<PageName> }) {
  return (page: PageName): void => deps.setActivePage(page);
}
