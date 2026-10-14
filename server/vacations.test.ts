import assert from 'node:assert/strict';
import {
  isSupportedVacationYear,
  resolveVacationsForYear,
} from './vacations';

const estimate = resolveVacationsForYear(2028, null);
assert.equal(estimate.source.estimated, true);
assert.deepEqual(
  estimate.vacations.map(({ start, end }) => [start, end]),
  [
    ['2028-01-01', '2028-01-05'],
    ['2028-02-12', '2028-02-28'],
    ['2028-04-16', '2028-05-02'],
    ['2028-07-06', '2028-08-31'],
    ['2028-10-23', '2028-11-07'],
    ['2028-12-20', '2028-12-31'],
  ],
);
assert.ok(estimate.vacations.every(({ name }) => name.toLowerCase().includes('vacances')));

const local = resolveVacationsForYear(2025, null);
assert.equal(local.source.local, true);
assert.equal(local.source.estimated, undefined);
assert.equal(local.vacations[1].start, '2025-02-08');
assert.equal(resolveVacationsForYear(2026, null).vacations[1].start, '2026-02-21');
assert.equal(resolveVacationsForYear(2027, null).vacations[1].start, '2027-02-06');

const officialPeriod = { name: 'Vacances officielles', start: '2025-02-15', end: '2025-03-02' };
const official = resolveVacationsForYear(2025, {
  years: { 2025: { C: [officialPeriod] } },
  source: { dataset: 'official-test' },
});
assert.deepEqual(official.vacations, [officialPeriod]);
assert.equal(official.source.dataset, 'official-test');

assert.equal(isSupportedVacationYear(2020), true);
assert.equal(isSupportedVacationYear(2050), true);
assert.equal(isSupportedVacationYear(2019), false);
assert.equal(isSupportedVacationYear(2051), false);
assert.equal(isSupportedVacationYear(2025.5), false);

console.log('Vacation estimation tests passed.');