import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParameterProfile, PlanningTypeOption } from '@shared/types/parameters';
import { PARAMETERS_PATH, parameterPath } from '@/config/routes';
import { emptyDraft, findPlanningTypeCode } from '@/domain/parameters/draft';
import { getSection } from '@/domain/parameters/sections';
import type { LoadStatus, ParameterDraft } from '@/domain/parameters/types';
import { createCancelParameterEdit } from '@/handlers/parameters/cancelParameterEdit';
import { createDeleteParameter } from '@/handlers/parameters/deleteParameter';
import { createChangeParameterField, createChangeSectionField } from '@/handlers/parameters/editParameterDraft';
import { createLoadParameterDetail } from '@/handlers/parameters/loadParameterDetail';
import { createSaveParameter } from '@/handlers/parameters/saveParameter';
import { useServices } from './useServices';

/** Detail of one parameter, or the creation of a new one when `id` is null. */
export function useParameterDetail(id: number | null) {
  const services = useServices();
  const navigate = useNavigate();
  const [planningTypes, setPlanningTypes] = useState<PlanningTypeOption[]>([]);
  const [profile, setProfile] = useState<ParameterProfile | null>(null);
  const [draft, setDraft] = useState<ParameterDraft>(emptyDraft);
  const [editing, setEditing] = useState(id === null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void createLoadParameterDetail({
      id,
      parameters: services.parameters,
      planningTypes: services.planningTypes,
      setPlanningTypes,
      setProfile,
      setDraft,
      setStatus,
      setError,
    })(() => cancelled);
    return () => { cancelled = true; };
  }, [services, id]);

  const clearError = () => setError('');
  const backToList = () => navigate(PARAMETERS_PATH);

  return {
    status,
    error,
    saving,
    editing,
    draft,
    planningTypes,
    section: getSection(findPlanningTypeCode(planningTypes, draft.planningTypeId)),
    isNew: id === null,
    onEdit: () => setEditing(true),
    onFieldChange: createChangeParameterField({ setDraft, clearError }),
    onSectionChange: createChangeSectionField({ setDraft, clearError }),
    onCancel: createCancelParameterEdit({
      profile,
      setDraft,
      setEditing,
      setError,
      onCancelCreation: backToList,
    }),
    onDelete: createDeleteParameter({
      id,
      saving,
      parameters: services.parameters,
      setSaving,
      setError,
      confirm: () => window.confirm(`Supprimer le paramètre « ${draft.name || 'sans nom'} » ?`),
      onDeleted: backToList,
    }),
    onSave: createSaveParameter({
      id,
      draft,
      planningTypes,
      saving,
      parameters: services.parameters,
      setProfile,
      setDraft,
      setEditing,
      setSaving,
      setError,
      onCreated: (createdId) => navigate(parameterPath(createdId), { replace: true }),
    }),
  };
}

export type ParameterDetailModel = ReturnType<typeof useParameterDetail>;
