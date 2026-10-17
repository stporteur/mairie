import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSidebar } from '@/hooks/useSidebar';
import { DEFAULT_PAGE, PAGES } from '@/pages/pageRegistry';
import PageBanner from './PageBanner';
import Sidebar from './Sidebar';

function AppLayout() {
  const sidebar = useSidebar();
  const { pathname } = useLocation();
  const page = PAGES.find((candidate) => pathname === `/${candidate.path}` || pathname.startsWith(`/${candidate.path}/`)) ?? DEFAULT_PAGE;

  return (
    <div className={`portal-shell ${!sidebar.open ? 'sidebar-closed' : ''}`}>
      <Sidebar pages={PAGES} open={sidebar.open} onToggle={sidebar.onToggle} />
      <main className="main-content">
        <PageBanner title={page.title} subtitle={page.subtitle} />
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default AppLayout;
