import assert from 'node:assert/strict';
import { buildEstimatedVacationPeriods, computeVacationStatistics, STATISTICS_FROM_YEAR } from '../shared/vacations';
import type { HistoricalVacation } from '../shared/vacations';
import {
  isSupportedVacationYear,
  resolveVacationsForYear,
} from './domain/vacations';

const history: HistoricalVacation[] = [
  { name: 'hiver', start: '2020-02-08', end: '2020-02-23' },
  { name: 'hiver', start: '2022-02-19', end: '2022-03-06' },
  { name: 'printemps', start: '2021-04-17', end: '2021-05-02' },
  { name: 'printemps', start: '2023-04-22', end: '2023-05-07' },
  { name: 'toussaint', start: '2021-10-23', end: '2021-11-07' },
  { name: 'toussaint', start: '2023-10-21', end: '2023-11-05' },
  { name: 'noel', start: '2021-12-18', end: '2022-01-02' },
  // Before 2012 the holidays had another shape and must not weigh on the statistics.
  { name: 'toussaint', start: '2001-10-27', end: '2001-11-04' },
];

const statistics = computeVacationStatistics(history);
assert.equal(statistics.hiver?.meanStartOffset, 43.5);
assert.equal(statistics.hiver?.medianLength, 16);
assert.equal(statistics.toussaint?.meanStartOffset, 294);
assert.equal(statistics.toussaint?.medianLength, 16);
assert.equal(statistics.ete, undefined);

const estimate = resolveVacationsForYear(2028, null, history);
assert.equal(estimate.source.estimated, true);
assert.ok(estimate.vacations.every(({ estimated }) => estimated === true));
assert.ok(estimate.vacations.every(({ name }) => name.toLowerCase().includes('vacances')));
assert.deepEqual(
  estimate.vacations.map(({ start }) => start),
  ['2028-01-01', '2028-02-12', '2028-04-22', '2028-07-01', '2028-10-21', '2028-12-23'],
);

const withoutHistory = buildEstimatedVacationPeriods(2028);
assert.deepEqual(
  withoutHistory.map(({ name }) => name),
  ['Vacances de Noël (début d’année)', 'Grandes vacances', 'Vacances de Noël (fin d’année)'],
);

for (let year = 2020; year <= 2050; year += 1) {
  const endOfYear = buildEstimatedVacationPeriods(year, history).find(({ name }) => name.includes('fin d’année'));
  const startOfYear = buildEstimatedVacationPeriods(year + 1, history).find(({ name }) => name.includes('début d’année'));
  assert.ok(endOfYear && startOfYear, `estimated Christmas holidays exist for ${year}`);

  assert.equal(new Date(`${endOfYear.start}T00:00:00Z`).getUTCDay(), 6, `Christmas ${year} starts on Saturday`);
  assert.ok(endOfYear.start >= `${year}-12-17` && endOfYear.start <= `${year}-12-23`, `Christmas ${year} starts between the 17th and the 23rd`);
  assert.equal(endOfYear.end, `${year}-12-31`, `Christmas ${year} is clipped to the end of the year`);

  assert.equal(startOfYear.start, `${year + 1}-01-01`, `January 1st is included for ${year + 1}`);
  const length = (Date.parse(`${startOfYear.end}T00:00:00Z`) - Date.parse(`${endOfYear.start}T00:00:00Z`)) / 86_400_000 + 1;
  assert.equal(length, 16, `Christmas ${year} spans two weeks`);
  assert.equal(new Date(`${startOfYear.end}T00:00:00Z`).getUTCDay(), 0, `Christmas ${year} ends on Sunday`);
}

for (let year = 2020; year <= 2050; year += 1) {
  const summer = buildEstimatedVacationPeriods(year, history).find(({ name }) => name === 'Grandes vacances');
  assert.ok(summer, `estimated summer period exists for ${year}`);
  const firstJulySaturday = new Date(Date.UTC(year, 6, 1));
  while (firstJulySaturday.getUTCDay() !== 6) {
    firstJulySaturday.setUTCDate(firstJulySaturday.getUTCDate() + 1);
  }
  assert.equal(summer.start, firstJulySaturday.toISOString().slice(0, 10), `estimated summer starts on the first Saturday of July for ${year}`);
  assert.equal(summer.end, `${year}-08-31`);
}

for (let year = 2020; year <= 2050; year += 1) {
  for (const period of buildEstimatedVacationPeriods(year, history).filter(({ name }) =>
    /hiver|printemps|toussaint/i.test(name),
  )) {
    const start = new Date(`${period.start}T00:00:00Z`);
    const end = new Date(`${period.end}T00:00:00Z`);
    assert.equal(start.getUTCDay(), 6, `${period.name} ${year} starts on Saturday`);
    assert.equal(end.getUTCDay(), 0, `${period.name} ${year} ends on Sunday`);
  }
}

const fallback = resolveVacationsForYear(2025, null, history);
assert.equal(fallback.source.estimated, true);
assert.equal(fallback.source.local, undefined);

const officialPeriod = { name: 'Vacances officielles', start: '2025-02-15', end: '2025-03-02' };
const official = resolveVacationsForYear(2025, {
  years: { 2025: { C: [officialPeriod] } },
  source: { dataset: 'official-test' },
}, history);
assert.deepEqual(official.vacations.find((period) => period.start === officialPeriod.start), { ...officialPeriod, estimated: false });
assert.equal(official.source.dataset, 'official-test');
assert.equal(official.source.estimated, true);

const stored = resolveVacationsForYear(2025, {
  years: { 2025: { C: [{ name: 'Officiel', start: '2025-02-15', end: '2025-03-02' }] } },
}, [{ name: 'hiver', start: '2025-02-20', end: '2025-03-05' }]);
assert.ok(stored.vacations.some((period) => period.name === 'Vacances d’hiver' && period.start === '2025-02-20' && !period.estimated));
assert.ok(!stored.vacations.some((period) => period.name === 'Officiel'));
assert.equal(stored.source.local, true);

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
}, history);
assert.equal(partialOfficial.source.estimated, true);
assert.ok(partialOfficial.vacations.some((period) => period.name.includes('Toussaint') && period.estimated));
assert.ok(partialOfficial.vacations.some((period) => period.start === '2028-12-23' && period.estimated));
assert.ok(partialOfficial.vacations.filter((period) => !period.estimated).length === 4);

const thisYear = new Date().getFullYear();
assert.equal(isSupportedVacationYear(STATISTICS_FROM_YEAR), true);
assert.equal(isSupportedVacationYear(thisYear + 50), true);
assert.equal(isSupportedVacationYear(STATISTICS_FROM_YEAR - 1), false);
assert.equal(isSupportedVacationYear(thisYear + 51), false);
assert.equal(isSupportedVacationYear(thisYear + 0.5), false);

console.log('Vacation estimation tests passed.');
