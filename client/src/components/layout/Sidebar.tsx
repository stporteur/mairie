import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NavLink } from 'react-router-dom';
import type { PageDefinition } from '@/pages/pageRegistry';

interface SidebarProps {
  pages: readonly PageDefinition[];
  open: boolean;
  onToggle: () => void;
}

function Sidebar({ pages, open, onToggle }: SidebarProps) {
  const toggleLabel = open ? 'Replier le menu' : 'Déplier le menu';

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="brand"><span>L'Haÿ-les-Roses</span></div>
      <nav>
        {pages.map((page) => (
          <NavLink
            key={page.path}
            to={`/${page.path}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            aria-label={page.title}
            title={page.title}
          >
            {page.icon}
            <span className="nav-label">{page.title}</span>
          </NavLink>
        ))}
      </nav>
      <button className="sidebar-toggle" type="button" onClick={onToggle} title={toggleLabel} aria-label={toggleLabel} aria-expanded={open}>
        {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </button>
    </aside>
  );
}

export default Sidebar;
