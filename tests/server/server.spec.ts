import type { Request, Response } from 'express';
import { createWorkbookHandler } from '../../server/handlers/createWorkbookHandler';
import { createGetVacations } from '../../server/handlers/getVacations';
import { getStatus } from '../../server/handlers/getStatus';
import { isSupportedVacationYear, resolveVacationsForYear } from '../../server/domain/vacations';
import { CachedOfficialVacationsSource, ChainedOfficialVacationsSource } from '../../server/infrastructure/officialVacations/officialVacationsSources';
import { parseVacationsCsv } from '../../server/infrastructure/officialVacations/vacationsParsing';
import { safeProfileName } from '../../server/export/safeProfileName';

function fakeResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
    send(payload: unknown) { this.body = payload; return this; },
    setHeader(name: string, value: string) { this.headers[name] = value; },
  };
  return res;
}

const asReq = (value: unknown) => value as Request;
const asRes = (value: unknown) => value as Response;

describe('server vacations domain', () => {
  it('supports years from 2020 to 2059', () => {
    expect(isSupportedVacationYear(2019)).toBe(false);
    expect(isSupportedVacationYear(2020)).toBe(true);
    expect(isSupportedVacationYear(2059)).toBe(true);
    expect(isSupportedVacationYear(2060)).toBe(false);
    expect(isSupportedVacationYear(2026.5)).toBe(false);
  });

  it('uses local data for known years and estimates for the others', () => {
    expect(resolveVacationsForYear(2026, null).source).toEqual({ local: true });
    expect(resolveVacationsForYear(2040, null).source).toEqual({ estimated: true });
  });
});

describe('GET /api/vacations/:year handler', () => {
  it('rejects unsupported years', async () => {
    const res = fakeResponse();
    await createGetVacations({ getOfficialVacations: jest.fn() })(asReq({ params: { year: '1999' } }), asRes(res));
    expect(res.statusCode).toBe(400);
  });

  it('falls back to local data when the official source fails', async () => {
    const res = fakeResponse();
    const source = { getOfficialVacations: jest.fn().mockRejectedValue(new Error('down')) };
    await createGetVacations(source)(asReq({ params: { year: '2026' } }), asRes(res));
    expect(res.body).toMatchObject({ year: 2026, zone: 'C', source: { local: true } });
  });
});

describe('workbook handler', () => {
  it('sends the file with its headers', async () => {
    const res = fakeResponse();
    const handler = createWorkbookHandler(async () => ({ buffer: new ArrayBuffer(4), filename: 'a.xlsx' }), 'fallback');
    await handler(asReq({ body: {} }), asRes(res));
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Disposition']).toBe('attachment; filename="a.xlsx"');
  });

  it('answers 400 with the error message', async () => {
    const res = fakeResponse();
    await createWorkbookHandler(async () => { throw new Error('invalide'); }, 'fallback')(asReq({ body: {} }), asRes(res));
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalide' });
  });

  it('uses the fallback message for non-Error failures', async () => {
    const res = fakeResponse();
    await createWorkbookHandler(async () => { throw 'x'; }, 'fallback')(asReq({ body: {} }), asRes(res));
    expect(res.body).toEqual({ error: 'fallback' });
  });
});

describe('status handler', () => {
  it('reports ok', () => {
    const res = fakeResponse();
    getStatus(asReq({}), asRes(res));
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

describe('official vacations sources', () => {
  it('uses the first loader that returns data', async () => {
    const data = { years: {} };
    const second = jest.fn();
    const chain = new ChainedOfficialVacationsSource([
      { load: async () => null },
      { load: async () => data },
      { load: second },
    ]);
    await expect(chain.getOfficialVacations()).resolves.toBe(data);
    expect(second).not.toHaveBeenCalled();
  });

  it('caches successful results until the TTL expires', async () => {
    let now = 0;
    const inner = { getOfficialVacations: jest.fn().mockResolvedValue({ years: {} }) };
    const cached = new CachedOfficialVacationsSource(inner, 1000, () => now);
    await cached.getOfficialVacations();
    now = 500;
    await cached.getOfficialVacations();
    expect(inner.getOfficialVacations).toHaveBeenCalledTimes(1);
    now = 1500;
    await cached.getOfficialVacations();
    expect(inner.getOfficialVacations).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const inner = { getOfficialVacations: jest.fn().mockResolvedValue(null) };
    const cached = new CachedOfficialVacationsSource(inner, 1000, () => 0);
    await cached.getOfficialVacations();
    await cached.getOfficialVacations();
    expect(inner.getOfficialVacations).toHaveBeenCalledTimes(2);
  });

  it('parses the zone C periods of the per-day CSV', () => {
    const csv = [
      'date,vacances_zone_c,nom_vacances',
      '2026-02-21,True,Vacances d\'Hiver',
      '2026-02-22,True,Vacances d\'Hiver',
      '2026-02-23,False,',
      '2026-04-11,True,Vacances de Printemps',
    ].join('\n');
    expect(parseVacationsCsv(csv)).toEqual({
      2026: [
        { name: 'Vacances d\'Hiver', start: '2026-02-21', end: '2026-02-22' },
        { name: 'Vacances de Printemps', start: '2026-04-11', end: '2026-04-11' },
      ],
    });
  });

  it('rejects a CSV without the expected columns', () => {
    expect(parseVacationsCsv('a,b\n1,2')).toBeNull();
  });
});

describe('safeProfileName', () => {
  it('removes accents and symbols and defaults to CUSTOM', () => {
    expect(safeProfileName('37h30 Mairie é')).toBe('37H30_MAIRIE_E');
    expect(safeProfileName('---')).toBe('CUSTOM');
  });
});
