import type { PlanningTypeOption } from '@shared/types/parameters';
import type { DraftField } from '@/domain/parameters/draft';
import type { ParameterDraft, SectionDefinition, SectionKey } from '@/domain/parameters/types';
import WeekdaysPicker from './WeekdaysPicker';

interface ParameterFormProps {
  draft: ParameterDraft;
  planningTypes: PlanningTypeOption[];
  section: SectionDefinition | undefined;
  readOnly: boolean;
  onFieldChange: (field: DraftField, value: string) => void;
  onSectionChange: (section: SectionKey, key: string, value: string) => void;
}

/** Common fields plus the section matching the selected planning type. */
function ParameterForm({ draft, planningTypes, section, readOnly, onFieldChange, onSectionChange }: ParameterFormProps) {
  return (
    <>
      <div className="month-grid leave-settings-grid">
        <label className="month-input">
          <span>Nom</span>
          <input type="text" maxLength={128} value={draft.name} disabled={readOnly} onChange={(event) => onFieldChange('name', event.target.value)} />
        </label>
        <label className="month-input">
          <span>Type de paramètre</span>
          <select value={draft.planningTypeId} disabled={readOnly} onChange={(event) => onFieldChange('planningTypeId', event.target.value)}>
            <option value="">— Choisir un type —</option>
            {planningTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </label>
        <label className="month-input">
          <span>Jours de CP</span>
          <input type="number" min="0" step="1" value={draft.holidays} disabled={readOnly} onChange={(event) => onFieldChange('holidays', event.target.value)} />
        </label>
        <label className="month-input">
          <span>Jours de RTT</span>
          <input type="number" min="0" step="1" value={draft.rtt} disabled={readOnly} onChange={(event) => onFieldChange('rtt', event.target.value)} />
        </label>
      </div>

      {section ? (
        <fieldset className="parameters-section" aria-label={section.title}>
          <legend>{section.title}</legend>
          <div className="month-grid leave-settings-grid">
            {section.fields.map((field) => field.kind === 'weekdays' ? (
              <WeekdaysPicker
                key={field.key}
                label={field.label}
                value={draft.sections[section.key][field.key] ?? ''}
                disabled={readOnly}
                onChange={(value) => onSectionChange(section.key, field.key, value)}
              />
            ) : (
              <label key={field.key} className="month-input">
                <span>{field.label}</span>
                <input
                  type={field.kind === 'number' ? 'number' : 'text'}
                  min={field.kind === 'number' ? '0' : undefined}
                  step={field.step}
                  value={draft.sections[section.key][field.key] ?? ''}
                  disabled={readOnly}
                  onChange={(event) => onSectionChange(section.key, field.key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </>
  );
}

export default ParameterForm;
