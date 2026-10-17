import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InsightsIcon from '@mui/icons-material/Insights';
import type { ReactNode } from 'react';
import { PAGES, type PageName } from '@/config/constants';

interface SidebarProps {
  open: boolean;
  activePage: PageName;
  onSelectPage: (page: PageName) => void;
  onToggle: () => void;
}

const NAV_ICONS: Record<PageName, ReactNode> = {
  planning: <CalendarMonthIcon />,
  forecast: <InsightsIcon />,
};

function Sidebar({ open, activePage, onSelectPage, onToggle }: SidebarProps) {
  const toggleLabel = open ? 'Replier le menu' : 'Déplier le menu';

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="brand"><span>L'Haÿ-les-Roses</span></div>
      <nav>
        {(Object.keys(PAGES) as PageName[]).map((page) => (
          <button
            key={page}
            className={`nav-item ${activePage === page ? 'active' : ''}`}
            type="button"
            onClick={() => onSelectPage(page)}
            aria-current={activePage === page ? 'page' : undefined}
            aria-label={PAGES[page].title}
            title={PAGES[page].title}
          >
            {NAV_ICONS[page]}
            <span className="nav-label">{PAGES[page].title}</span>
          </button>
        ))}
      </nav>
      <button className="sidebar-toggle" type="button" onClick={onToggle} title={toggleLabel} aria-label={toggleLabel} aria-expanded={open}>
        {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </button>
    </aside>
  );
}

export default Sidebar;
