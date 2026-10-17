import type { Request, Response } from 'express';
import { buildParameterProfiles } from '../../server/domain/parameters/buildParameterProfiles';
import type { Parameter, ParameterAtsem, ParameterStandard } from '../../server/domain/parameters/types';
import { createGetParameters } from '../../server/handlers/getParameters';
import type { ParametersRepository } from '../../server/ports/ParametersRepository';
import type { ParameterProfile } from '../../shared/types/parameters';

const atsemType = { id: 2, code: 'ATSEM', name: 'ATSEM' };
const standardType = { id: 1, code: 'STANDARD', name: 'Standard' };

const parameters: Parameter[] = [
  { id: 1, name: 'ATSEM 37h30', holidays: 25, rtt: 15, planningType: atsemType },
  { id: 3, name: 'MAIRIE 37h30', holidays: 25, rtt: 15, planningType: standardType },
  { id: 4, name: 'Sans type', holidays: null, rtt: null, planningType: { id: 9, code: 'OTHER', name: 'Autre' } },
];
const atsemRows: ParameterAtsem[] = [
  {
    id: 1,
    parameter: parameters[0],
    holidayPeriodOffdays: null,
    holidayPeriodHours: 37.5,
    schoolPeriodOffdays: 'mercredi',
    schoolPeriodHours: 37.5,
  },
];
const standardRows: ParameterStandard[] = [{ id: 1, parameter: parameters[1], weekHours: 37.5 }];

function fakeResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
}

describe('buildParameterProfiles', () => {
  const profiles = buildParameterProfiles(parameters, atsemRows, standardRows);

  it('attaches the ATSEM hours to ATSEM parameters only', () => {
    expect(profiles[0]).toEqual({
      id: 1,
      name: 'ATSEM 37h30',
      planningType: 'ATSEM',
      holidays: 25,
      rtt: 15,
      atsem: { holidayPeriodOffdays: null, holidayPeriodHours: 37.5, schoolPeriodOffdays: 'mercredi', schoolPeriodHours: 37.5 },
      standard: null,
    });
  });

  it('attaches the standard hours to STANDARD parameters only', () => {
    expect(profiles[1].planningType).toBe('STANDARD');
    expect(profiles[1].standard).toEqual({ weekHours: 37.5 });
    expect(profiles[1].atsem).toBeNull();
  });

  it('maps unknown planning types and missing values to null', () => {
    expect(profiles[2]).toMatchObject({ planningType: null, holidays: null, rtt: null, atsem: null, standard: null });
  });
});

describe('createGetParameters', () => {
  it('returns the profiles from the repository', async () => {
    const profiles: ParameterProfile[] = buildParameterProfiles(parameters, atsemRows, standardRows);
    const repository: ParametersRepository = { findAll: async () => profiles };
    const res = fakeResponse();

    await createGetParameters(repository)({} as Request, res as unknown as Response);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(profiles);
  });

  it('answers 500 when the repository fails', async () => {
    const repository: ParametersRepository = { findAll: async () => { throw new Error('db down'); } };
    const res = fakeResponse();

    await createGetParameters(repository)({} as Request, res as unknown as Response);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Impossible de lire les paramètres.' });
  });
});
