import { useEffect, useState } from 'react';
import { toLeaveProfiles } from '@/application/toLeaveProfiles';
import type { LeaveProfiles } from '@/domain/settings/types';
import { useServices } from './useServices';

export type LeaveProfilesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profiles: LeaveProfiles };

/** Loads the leave profiles served by the API once. */
export function useLeaveProfiles(): LeaveProfilesState {
  const services = useServices();
  const [state, setState] = useState<LeaveProfilesState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    services.parameters.fetchParameters().then(
      (parameters) => {
        if (!cancelled) setState({ status: 'ready', profiles: toLeaveProfiles(parameters) });
      },
      (failure: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: failure instanceof Error ? failure.message : 'Impossible de charger les paramètres.',
          });
        }
      },
    );
    return () => { cancelled = true; };
  }, [services]);

  return state;
}
