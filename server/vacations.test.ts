import assert from 'node:assert/strict';
import { buildEstimatedVacationPeriods } from '../shared/vacations';
import {
  isSupportedVacationYear,
  resolveVacationsForYear,
} from './vacations';

const estimate = resolveVacationsForYear(2028, null);
assert.equal(estimate.source.estimated, true);
assert.ok(estimate.vacations.every(({ estimated }) => estimated === true));
assert.deepEqual(
  estimate.vacations.map(({ start, end }) => [start, end]),
  [
    ['2028-01-01', '2028-01-09'],
    ['2028-02-12', '2028-02-27'],
    ['2028-04-15', '2028-04-30'],
    ['2028-07-01', '2028-08-31'],
    ['2028-10-21', '2028-11-05'],
    ['2028-12-16', '2028-12-31'],
  ],
);
assert.ok(estimate.vacations.every(({ name }) => name.toLowerCase().includes('vacances')));

const christmas2028 = buildEstimatedVacationPeriods(2028).find(({ name }) => name.includes('fin d’année'));
assert.ok(christmas2028);
assert.equal(christmas2028.start, '2028-12-16');
assert.equal(christmas2028.end, '2028-12-31');
assert.ok(christmas2028.start <= '2028-12-25' && christmas2028.end >= '2028-12-25');
assert.ok(christmas2028.start <= '2028-12-31' && christmas2028.end >= '2028-12-31');
assert.equal(new Date('2029-01-01T00:00:00Z').getUTCDay(), 1);
assert.ok(!buildEstimatedVacationPeriods(2029).some(({ start, end }) => '2029-01-02' >= start && '2029-01-02' <= end));

for (let year = 2020; year <= 2050; year += 1) {
  const christmas = buildEstimatedVacationPeriods(year).find(({ name }) => name.includes('fin d’année'));
  assert.ok(christmas, `estimated Christmas holidays exist for ${year}`);
  assert.ok(christmas.start <= `${year}-12-25` && christmas.end >= `${year}-12-25`, `Christmas is included for ${year}`);
  assert.ok(christmas.start <= `${year}-12-31` && christmas.end >= `${year}-12-31`, `December 31 is included for ${year}`);
  const start = new Date(`${christmas.start}T00:00:00Z`);
  const end = new Date(`${christmas.end}T00:00:00Z`);
  assert.equal(start.getUTCDay(), 6, `estimated Christmas starts on Saturday for ${year}`);
  assert.equal(end.getUTCDay(), 0, `estimated Christmas ends on Sunday for ${year}`);
  assert.equal((end.getTime() - start.getTime()) / 86_400_000, 15, `estimated Christmas spans two weeks for ${year}`);
}

for (let year = 2020; year <= 2050; year += 1) {
  const summer = buildEstimatedVacationPeriods(year).find(({ name }) => name === 'Grandes vacances');
  assert.ok(summer, `estimated summer period exists for ${year}`);
  const firstJulySaturday = new Date(Date.UTC(year, 6, 1));
  while (firstJulySaturday.getUTCDay() !== 6) {
    firstJulySaturday.setUTCDate(firstJulySaturday.getUTCDate() + 1);
  }
  assert.equal(summer.start, firstJulySaturday.toISOString().slice(0, 10), `estimated summer starts on the first Saturday of July for ${year}`);
  assert.equal(summer.end, `${year}-08-31`);
}

for (const period of estimate.vacations.filter(({ name }) =>
  /hiver|printemps|toussaint|no[eë]l/i.test(name) && !name.includes('début d’année'),
)) {
  const start = new Date(`${period.start}T00:00:00Z`);
  const end = new Date(`${period.end}T00:00:00Z`);
  assert.equal(start.getUTCDay(), 6, `${period.name} starts on Saturday`);
  assert.equal(end.getUTCDay(), 0, `${period.name} ends on Sunday`);
  assert.equal((end.getTime() - start.getTime()) / 86_400_000, 15, `${period.name} spans two weeks`);
}

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
assert.deepEqual(official.vacations[0], { ...officialPeriod, estimated: false });
assert.equal(official.source.dataset, 'official-test');
assert.equal(official.source.estimated, true);

const partialOfficial = resolveVacationsForYear(2028, {
  years: {
    2028: [
      { name: 'Vacances de Noël', start: '2028-01-01', end: '2028-01-02' },
      { name: "Vacances d'hiver", start: '2028-02-12', end: '2028-02-27' },
      { name: 'Vacances de printemps', start: '2028-04-15', end: '2028-05-01' },
      { name: "Vacances d'été", start: '2028-07-04', end: '2028-08-31' },
    ],
  },
  source: { dataset: 'official-test', resource: { title: 'Calendrier officiel' } },
});
assert.equal(partialOfficial.source.estimated, true);
assert.ok(partialOfficial.vacations.some((period) => period.name.includes('Toussaint') && period.estimated));
assert.ok(partialOfficial.vacations.some((period) => period.start === '2028-12-16' && period.estimated));
assert.ok(partialOfficial.vacations.filter((period) => !period.estimated).length === 4);
const estimate2029 = resolveVacationsForYear(2029, null);
assert.equal(estimate2029.vacations.length, 5);
assert.ok(estimate2029.vacations.some(({ name }) => name.includes('hiver')));
assert.ok(estimate2029.vacations.some(({ name }) => name.includes('printemps')));
assert.ok(estimate2029.vacations.some(({ name }) => name.includes('Toussaint')));
assert.ok(estimate2029.vacations.some(({ name }) => name.includes('Noël')));

assert.equal(isSupportedVacationYear(2020), true);
assert.equal(isSupportedVacationYear(2050), true);
assert.equal(isSupportedVacationYear(2019), false);
assert.equal(isSupportedVacationYear(2051), false);
assert.equal(isSupportedVacationYear(2025.5), false);

console.log('Vacation estimation tests passed.');