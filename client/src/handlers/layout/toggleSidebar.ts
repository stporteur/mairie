import type { StateSetter } from '../types';

export function createToggleSidebar(deps: { setOpen: StateSetter<boolean> }) {
  return (): void => deps.setOpen((open) => !open);
}
