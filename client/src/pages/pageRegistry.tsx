import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InsightsIcon from '@mui/icons-material/Insights';
import SettingsIcon from '@mui/icons-material/Settings';
import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';

export interface PageDefinition {
  /** URL segment; also the route key. A page may handle its own sub-routes below it. */
  path: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  component: LazyExoticComponent<ComponentType>;
}

/**
 * Single source of truth for the portal pages: adding a page means adding
 * one entry here. Menu, routes and banner are all derived from this list.
 */
export const PAGES: readonly PageDefinition[] = [
  {
    path: 'planning',
    title: 'Planning',
    subtitle: 'Analyse annuelle du temps de travail, des congés et de la formation.',
    icon: <CalendarMonthIcon />,
    component: lazy(() => import('./PlanningRoute')),
  },
  {
    path: 'forecast',
    title: 'Prévisionnel',
    subtitle: 'Projection des heures et congés sur les dix prochaines années.',
    icon: <InsightsIcon />,
    component: lazy(() => import('./ForecastRoute')),
  },
  {
    path: 'parameters',
    title: 'Paramètres',
    subtitle: 'Configuration des profils horaires et des congés.',
    icon: <SettingsIcon />,
    component: lazy(() => import('./ParametersRoute')),
  },
];

export const DEFAULT_PAGE = PAGES[0];
