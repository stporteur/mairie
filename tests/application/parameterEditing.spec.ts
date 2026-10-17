import type { ParameterProfile, PlanningTypeOption } from '@shared/types/parameters';
import { emptyDraft, findPlanningTypeCode, setDraftField, setSectionField, toDraft, toInput } from '@/domain/parameters/draft';
import { getSection } from '@/domain/parameters/sections';
import { validateParameterDraft } from '@/domain/parameters/validate';
import { createCancelParameterEdit } from '@/handlers/parameters/cancelParameterEdit';
import { createDeleteParameter } from '@/handlers/parameters/deleteParameter';
import { joinWeekdays, parseWeekdays, toggleWeekday } from '@/domain/parameters/weekdays';
import { createSaveParameter } from '@/handlers/parameters/saveParameter';
import type { ParametersGateway } from '@/ports/ParametersGateway';

const types: PlanningTypeOption[] = [
  { id: 1, code: 'STANDARD', name: 'Standard' },
  { id: 2, code: 'ATSEM', name: 'ATSEM' },
];

const atsem: ParameterProfile = {
  id: 1, name: 'ATSEM 37h30', planningTypeId: 2, planningType: 'ATSEM', holidays: 25, rtt: 15, standard: null,
  atsem: { holidayPeriodOffdays: null, holidayPeriodHours: 35, schoolPeriodOffdays: 'mercredi', schoolPeriodHours: 37 },
};

function gateway(overrides: Partial<ParametersGateway> = {}): ParametersGateway {
  return {
    fetchParameters: jest.fn(),
    fetchParameter: jest.fn(),
    createParameter: jest.fn().mockResolvedValue({ ...atsem, id: 9 }),
    updateParameter: jest.fn().mockResolvedValue(atsem),
    deleteParameter: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('parameter draft', () => {
  it('round-trips a profile through the form values', () => {
    const draft = toDraft(atsem);
    expect(draft).toMatchObject({ name: 'ATSEM 37h30', holidays: '25', planningTypeId: '2' });
    expect(draft.sections.atsem).toEqual({
      schoolPeriodHours: '37', schoolPeriodOffdays: 'mercredi', holidayPeriodHours: '35', holidayPeriodOffdays: '',
    });
    expect(toInput(draft, types)).toEqual({
      name: 'ATSEM 37h30', holidays: 25, rtt: 15, planningTypeId: 2, standard: null, atsem: atsem.atsem,
    });
  });

  it('only sends the section of the selected type, with comma decimals', () => {
    let draft = setDraftField(emptyDraft(), 'name', 'Mairie');
    draft = setDraftField(draft, 'planningTypeId', '1');
    draft = setSectionField(draft, 'standard', 'weekHours', '37,5');
    draft = setSectionField(draft, 'atsem', 'schoolPeriodHours', '10');
    expect(toInput(draft, types)).toMatchObject({ atsem: null, standard: { weekHours: 37.5 } });
  });

  it('picks the form matching the planning type', () => {
    expect(findPlanningTypeCode(types, '2')).toBe('ATSEM');
    expect(getSection('ATSEM')?.key).toBe('atsem');
    expect(getSection('STANDARD')?.fields).toHaveLength(1);
    expect(getSection('constructor')).toBeUndefined();
  });
});

describe('validateParameterDraft', () => {
  it('requires a name and a type', () => {
    expect(validateParameterDraft(emptyDraft(), types)).toMatch(/nom/);
    expect(validateParameterDraft(setDraftField(emptyDraft(), 'name', 'x'), types)).toMatch(/type/);
  });

  it('checks the numbers of the selected section', () => {
    const draft = toDraft(atsem);
    expect(validateParameterDraft(draft, types)).toBeNull();
    expect(validateParameterDraft(setSectionField(draft, 'atsem', 'schoolPeriodHours', '200'), types)).toMatch(/Scolaire/);
    expect(validateParameterDraft(setDraftField(draft, 'rtt', '1.5'), types)).toMatch(/entiers/);
  });
});

describe('save and cancel handlers', () => {
  function deps(over: Record<string, unknown> = {}) {
    return {
      id: null as number | null,
      draft: toDraft(atsem),
      planningTypes: types,
      saving: false,
      parameters: gateway(),
      setProfile: jest.fn(),
      setDraft: jest.fn(),
      setEditing: jest.fn(),
      setSaving: jest.fn(),
      setError: jest.fn(),
      onCreated: jest.fn(),
      ...over,
    };
  }

  it('creates a parameter and reports its id', async () => {
    const d = deps();
    await createSaveParameter(d)();
    expect(d.parameters.createParameter).toHaveBeenCalled();
    expect(d.onCreated).toHaveBeenCalledWith(9);
    expect(d.setEditing).toHaveBeenCalledWith(false);
  });

  it('updates an existing parameter without redirecting', async () => {
    const d = deps({ id: 1 });
    await createSaveParameter(d)();
    expect(d.parameters.updateParameter).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'ATSEM 37h30' }));
    expect(d.onCreated).not.toHaveBeenCalled();
  });

  it('shows validation and server errors and stays in edit mode', async () => {
    const invalid = deps({ draft: emptyDraft() });
    await createSaveParameter(invalid)();
    expect(invalid.setError).toHaveBeenCalledWith(expect.stringMatching(/nom/));
    expect(invalid.parameters.createParameter).not.toHaveBeenCalled();

    const failing = deps({ parameters: gateway({ createParameter: jest.fn().mockRejectedValue(new Error('Boom')) }) });
    await createSaveParameter(failing)();
    expect(failing.setError).toHaveBeenLastCalledWith('Boom');
    expect(failing.setEditing).not.toHaveBeenCalled();
    expect(failing.setSaving).toHaveBeenLastCalledWith(false);
  });

  it('restores the saved values on cancel, or leaves the page when creating', () => {
    const setDraft = jest.fn();
    const setEditing = jest.fn();
    const onCancelCreation = jest.fn();
    createCancelParameterEdit({ profile: atsem, setDraft, setEditing, setError: jest.fn(), onCancelCreation })();
    expect(setDraft).toHaveBeenCalledWith(toDraft(atsem));
    expect(setEditing).toHaveBeenCalledWith(false);

    createCancelParameterEdit({ profile: null, setDraft, setEditing, setError: jest.fn(), onCancelCreation })();
    expect(onCancelCreation).toHaveBeenCalled();
  });

  it('deletes after confirmation only', async () => {
    const base = { id: 1, saving: false, setSaving: jest.fn(), setError: jest.fn(), onDeleted: jest.fn() };
    const declined = { ...base, parameters: gateway(), confirm: () => false };
    await createDeleteParameter(declined)();
    expect(declined.parameters.deleteParameter).not.toHaveBeenCalled();

    const accepted = { ...base, parameters: gateway(), confirm: () => true };
    await createDeleteParameter(accepted)();
    expect(accepted.parameters.deleteParameter).toHaveBeenCalledWith(1);
    expect(accepted.onDeleted).toHaveBeenCalled();
  });

  it('keeps the page and shows the error when deletion fails', async () => {
    const failing = {
      id: 1, saving: false, setSaving: jest.fn(), setError: jest.fn(), onDeleted: jest.fn(), confirm: () => true,
      parameters: gateway({ deleteParameter: jest.fn().mockRejectedValue(new Error('Boom')) }),
    };
    await createDeleteParameter(failing)();
    expect(failing.setError).toHaveBeenLastCalledWith('Boom');
    expect(failing.onDeleted).not.toHaveBeenCalled();
    expect(failing.setSaving).toHaveBeenLastCalledWith(false);
  });
});

describe('weekdays', () => {
  it('joins in week order with bare commas', () => {
    expect(joinWeekdays(['vendredi', 'lundi'])).toBe('lundi,vendredi');
    expect(toggleWeekday('lundi', 'mercredi', true)).toBe('lundi,mercredi');
    expect(toggleWeekday('lundi,mercredi', 'lundi', false)).toBe('mercredi');
  });

  it('parses stored values leniently', () => {
    expect(parseWeekdays('Mardi, jeudi,foo')).toEqual(['mardi', 'jeudi']);
    expect(parseWeekdays('')).toEqual([]);
  });

  it('sends the days comma-joined without spaces, or null when none', () => {
    let draft = setDraftField(emptyDraft(), 'name', 'A');
    draft = setDraftField(draft, 'planningTypeId', '2');
    draft = setSectionField(draft, 'atsem', 'schoolPeriodOffdays', 'jeudi, lundi');
    expect(toInput(draft, types).atsem).toMatchObject({ schoolPeriodOffdays: 'lundi,jeudi', holidayPeriodOffdays: null });
  });
});
