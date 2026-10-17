import { useContext } from 'react';
import type { AppServices } from '@/application/AppServices';
import { ServicesContext } from './ServicesContext';

export function useServices(): AppServices {
  return useContext(ServicesContext);
}
