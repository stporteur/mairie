import { useState } from 'react';
import type { PageName } from '@/config/constants';
import { createSelectPage } from '@/handlers/layout/selectPage';
import { createToggleSidebar } from '@/handlers/layout/toggleSidebar';

export function useNavigation() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState<PageName>('planning');

  return {
    sidebarOpen,
    activePage,
    onToggleSidebar: createToggleSidebar({ setOpen: setSidebarOpen }),
    onSelectPage: createSelectPage({ setActivePage }),
  };
}
