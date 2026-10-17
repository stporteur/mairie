import { useEffect, useState } from 'react';
import type { ParameterProfile, PlanningTypeOption } from '@shared/types/parameters';
import type { LoadStatus } from '@/domain/parameters/types';
import { createLoadParametersList } from '@/handlers/parameters/loadParametersList';
import { useServices } from './useServices';

export function useParametersList() {
  const services = useServices();
  const [parameters, setParameters] = useState<ParameterProfile[]>([]);
  const [planningTypes, setPlanningTypes] = useState<PlanningTypeOption[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void createLoadParametersList({
      parameters: services.parameters,
      planningTypes: services.planningTypes,
      setParameters,
      setPlanningTypes,
      setStatus,
      setError,
    })(() => cancelled);
    return () => { cancelled = true; };
  }, [services]);

  return { parameters, planningTypes, status, error };
}

export type ParametersListModel = ReturnType<typeof useParametersList>;
