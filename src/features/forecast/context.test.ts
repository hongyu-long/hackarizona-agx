import { expect, it } from 'vitest';
import { withWeatherContext } from './context';
import { buildExperiment } from './experiment';
import data from '../../../data/forecast/srer-week.json';
it('uses only matching context issued by the prediction cutoff and preserves case IDs', () => {
  const experiment = buildExperiment([data]);
  const row = experiment.examples[0];
  const context = { site: row.site, validFrom: row.cutoff, validTo: row.targetEnd, availableAt: row.cutoff, cloudPercent: 50, source: 'test forecast', latitude: 31.9, longitude: -110.8, matchingMethod: 'nearest grid point' };
  expect(withWeatherContext([row], [context])[0].features.at(-1)).toBe(50);
  expect(withWeatherContext([row], [context])[0].id).toBe(row.id);
  expect(withWeatherContext([row], [{ ...context, availableAt: row.targetEnd }])).toEqual([]);
  expect(withWeatherContext([row], [{ ...context, site: 'another' }])).toEqual([]);
  expect(() => withWeatherContext([row], [{ ...context, cloudPercent: 101 }])).toThrow();
});
