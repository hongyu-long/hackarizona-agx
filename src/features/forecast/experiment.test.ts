import { expect, it } from 'vitest';
import { buildExperiment, score } from './experiment';
import data from '../../../data/forecast/srer-week.json';

it('constructs next-interval targets without leaking future temperature into inputs', () => {
  const first = buildExperiment([data]);
  expect(first.rawRecords).toBe(336);
  expect(first.limitations).toContain('Only 1 site available; two-site requirement is unmet.');
  const row = first.examples[0];
  expect(first.featureNames.slice(-4)).toEqual(['lowerTemperatureHeightM', 'upperTemperatureHeightM', 'lowerWindHeightM', 'upperWindHeightM']);
  expect(row.features.slice(-4)).toEqual([
    row.provenance.temperatureHeightsM[0],
    row.provenance.temperatureHeightsM[1],
    row.provenance.windHeightsM[0],
    row.provenance.windHeightsM[1]
  ]);
  const changed = structuredClone(data);
  const target = changed.records.find(r => r.start === row.cutoff)!;
  target.levels[target.levels.length - 1].temperatureC = target.levels[0].temperatureC + 100;
  const second = buildExperiment([changed]);
  expect(second.examples.find(r => r.id === row.id)?.features).toEqual(row.features);
  expect(second.examples.find(r => r.id === row.id)?.label).toBe(1);
  expect(first.examples.every(r => Date.parse(r.inputEnd) <= Date.parse(r.cutoff))).toBe(true);
  expect(first.test.length).toBeGreaterThan(0);
  expect(first.train.every(r => Date.parse(r.targetEnd) <= first.split.validationStart)).toBe(true);
});

it('rejects duplicate sites and removes unusable targets without fabricating negatives', () => {
  expect(() => buildExperiment([data, data])).toThrow('Duplicate site');
  const original = buildExperiment([data]);
  const changed = structuredClone(data);
  const cutoff = original.examples[0].cutoff;
  changed.records.find(r => r.start === cutoff)!.levels[0].temperatureQf = 1;
  expect(buildExperiment([changed]).examples.some(r => r.cutoff === cutoff)).toBe(false);
  expect(score([], []).accuracy).toBeNull();
  expect(() => score(original.test, [])).toThrow('align');
});
