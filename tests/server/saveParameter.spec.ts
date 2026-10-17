import type { Request, Response } from 'express';
import { validateParameterInput } from '../../server/domain/parameters/validateParameterInput';
import { createDeleteParameter } from '../../server/handlers/deleteParameter';
import { createGetParameter } from '../../server/handlers/getParameter';
import { createCreateParameter, createUpdateParameter } from '../../server/handlers/saveParameter';
import type { ParametersRepository } from '../../server/ports/ParametersRepository';
import type { PlanningTypesRepository } from '../../server/ports/PlanningTypesRepository';
import type { ParameterInput, ParameterProfile, PlanningTypeOption } from '../../shared/types/parameters';

const types: PlanningTypeOption[] = [
  { id: 1, code: 'STANDARD', name: 'Standard' },
  { id: 2, code: 'ATSEM', name: 'ATSEM' },
];

const standardInput: ParameterInput = {
  name: 'MAIRIE', holidays: 25, rtt: 15, planningTypeId: 1, atsem: null, standard: { weekHours: 37.5 },
};
const atsemInput: ParameterInput = {
  name: 'ATSEM', holidays: 25, rtt: 9, planningTypeId: 2, standard: null,
  atsem: { holidayPeriodOffdays: null, holidayPeriodHours: 35, schoolPeriodOffdays: 'mercredi', schoolPeriodHours: 37 },
};

const profile: ParameterProfile = {
  id: 7, name: 'MAIRIE', planningTypeId: 1, planningType: 'STANDARD', holidays: 25, rtt: 15, atsem: null, standard: { weekHours: 37.5 },
};

function fakeResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
    end() { return this; },
  };
}

function request(body: unknown, id?: string): Request {
  return { body, params: { id } } as unknown as Request;
}

function repository(overrides: Partial<ParametersRepository> = {}): ParametersRepository {
  return {
    findAll: async () => [],
    findById: async () => profile,
    create: async () => profile,
    update: async () => profile,
    delete: async () => true,
    ...overrides,
  };
}

const planningTypes: PlanningTypesRepository = { findAll: async () => types };

describe('validateParameterInput', () => {
  it('accepts a valid profile of each type', () => {
    expect(validateParameterInput(standardInput, types)).toBeNull();
    expect(validateParameterInput(atsemInput, types)).toBeNull();
  });

  it('requires a name and a known planning type', () => {
    expect(validateParameterInput({ ...standardInput, name: '  ' }, types)).toMatch(/nom/);
    expect(validateParameterInput({ ...standardInput, planningTypeId: null }, types)).toMatch(/type/);
    expect(validateParameterInput({ ...standardInput, planningTypeId: 99 }, types)).toMatch(/type/);
  });

  it('requires the section of the selected type and ignores the other one', () => {
    expect(validateParameterInput({ ...standardInput, standard: null }, types)).toMatch(/standard/);
    expect(validateParameterInput({ ...atsemInput, atsem: null }, types)).toMatch(/ATSEM/);
    expect(validateParameterInput({ ...standardInput, atsem: null, standard: { weekHours: 37.5 } }, types)).toBeNull();
  });

  it('rejects negative, fractional or out-of-range numbers', () => {
    expect(validateParameterInput({ ...standardInput, holidays: -1 }, types)).not.toBeNull();
    expect(validateParameterInput({ ...standardInput, rtt: 1.5 }, types)).not.toBeNull();
    expect(validateParameterInput({ ...standardInput, standard: { weekHours: 200 } }, types)).not.toBeNull();
  });
});

describe('parameter handlers', () => {
  it('returns a parameter, 404 when missing and 400 on a bad id', async () => {
    const ok = fakeResponse();
    await createGetParameter(repository())(request(undefined, '7'), ok as unknown as Response);
    expect(ok.body).toBe(profile);

    const missing = fakeResponse();
    await createGetParameter(repository({ findById: async () => null }))(request(undefined, '7'), missing as unknown as Response);
    expect(missing.statusCode).toBe(404);

    const bad = fakeResponse();
    await createGetParameter(repository())(request(undefined, 'abc'), bad as unknown as Response);
    expect(bad.statusCode).toBe(400);
  });

  it('creates a valid parameter with a 201', async () => {
    const create = jest.fn().mockResolvedValue(profile);
    const res = fakeResponse();
    await createCreateParameter({ parameters: repository({ create }), planningTypes })(request(standardInput), res as unknown as Response);
    expect(res.statusCode).toBe(201);
    expect(create).toHaveBeenCalledWith(standardInput);
  });

  it('rejects an invalid parameter without touching the repository', async () => {
    const create = jest.fn();
    const res = fakeResponse();
    await createCreateParameter({ parameters: repository({ create }), planningTypes })(request({ ...standardInput, name: '' }), res as unknown as Response);
    expect(res.statusCode).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('updates a parameter, answering 404 when it does not exist', async () => {
    const ok = fakeResponse();
    await createUpdateParameter({ parameters: repository(), planningTypes })(request(atsemInput, '7'), ok as unknown as Response);
    expect(ok.statusCode).toBe(200);

    const missing = fakeResponse();
    await createUpdateParameter({ parameters: repository({ update: async () => null }), planningTypes })(request(atsemInput, '7'), missing as unknown as Response);
    expect(missing.statusCode).toBe(404);
  });

  it('deletes a parameter with a 204, answering 404 or 400 otherwise', async () => {
    const ok = fakeResponse();
    await createDeleteParameter(repository())(request(undefined, '7'), ok as unknown as Response);
    expect(ok.statusCode).toBe(204);

    const missing = fakeResponse();
    await createDeleteParameter(repository({ delete: async () => false }))(request(undefined, '7'), missing as unknown as Response);
    expect(missing.statusCode).toBe(404);

    const bad = fakeResponse();
    await createDeleteParameter(repository())(request(undefined, 'abc'), bad as unknown as Response);
    expect(bad.statusCode).toBe(400);
  });

  it('answers 500 when the repository fails', async () => {
    const res = fakeResponse();
    await createCreateParameter({ parameters: repository({ create: async () => { throw new Error('db'); } }), planningTypes })(request(standardInput), res as unknown as Response);
    expect(res.statusCode).toBe(500);
  });
});
