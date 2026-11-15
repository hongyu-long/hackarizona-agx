import { expect, it } from 'vitest';
import { parseForecast, saveForecast, loadForecasts } from './artifact';
import { provenance } from './test-fixture';
const sample = { schemaVersion: 1, state: 'available', site: 'SRER', cutoff: '2024-06-01T10:00:00Z', targetEnd: '2024-06-01T10:30:00Z', generatedAt: '2026-11-15T10:00:00Z', predictor: 'persistence', modelVersion: '1', variant: 'tower', prediction: 1, reliability: 'uncalibrated', inputQuality: 'passed', source: 'NEON', inputReferences: ['SRER/2024-06-01T09:30:00Z'], limitations: ['Historical experiment'] };
it('round trips baseline evidence without inventing a confidence percentage', () => {
  const evidence = parseForecast({ ...sample, provenance });
  let raw: string | null = null;
  const storage = { getItem: () => raw, setItem: (_: string, value: string) => { raw = value; } };
  saveForecast(storage, evidence);
  expect(loadForecasts(storage)).toEqual([evidence]);
  expect(evidence).not.toHaveProperty('probability');
  expect(() => parseForecast({ ...sample, probability: 0.8 })).toThrow();
  expect(() => parseForecast({ ...sample, predictor: 'TabPFN', probability: 1.1 })).toThrow();
  expect(() => parseForecast({ ...sample, targetEnd: sample.cutoff })).toThrow();
});
