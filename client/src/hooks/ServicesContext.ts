import { createContext } from 'react';
import type { AppServices } from '@/application/AppServices';
import { createServices } from '@/composition';

/** Defaults to the real implementations; tests or other hosts can provide their own. */
export const ServicesContext = createContext<AppServices>(createServices());
