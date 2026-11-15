import { expect, it } from 'vitest';
import { loadEvaluationDatasets, parseEvaluationCsv } from './evaluationCases';

const header = 'timestamp,temperature_5ft_C,temperature_30ft_C,wind_speed_5ft_mph,wind_speed_30ft_mph,wind_direction_5ft_deg,wind_direction_30ft_deg';
const validRow = '2026-06-01 00:00:00,22.86,24.81,5.47,7.2,233.5,215.9';

it('parses supplied timestamped multi-height weather cases without inventing timezone display values', () => {
  expect(parseEvaluationCsv(`${header}\n${validRow}`)[0]).toMatchObject({
    timestamp: '2026-06-01 00:00:00',
    observedAt: '2026-06-01T00:00:00.000Z',
    lowerTemperatureC: 22.86,
    upperTemperatureC: 24.81,
    lowerWindMph: 5.47,
    upperWindMph: 7.2
  });
});

it.each([
  ['unexpected header', `timestamp,temperature\n${validRow}`],
  ['invalid number', `${header}\n${validRow.replace('22.86', 'NaN')}`],
  ['invalid direction', `${header}\n${validRow.replace('233.5', '361')}`],
  ['invalid timestamp', `${header}\n${validRow.replace('2026-06-01', '2026-02-30')}`]
])('rejects CSV with %s', (_description, csv) => {
  expect(() => parseEvaluationCsv(csv)).toThrow();
});

it('loads both supplied datasets and surfaces fetch failures', async () => {
  const response = (ok: boolean, text: string) => ({ ok, text: async () => text });
  const datasets = await loadEvaluationDatasets(async () => response(true, `${header}\n${validRow}`));
  expect(datasets.map(dataset => dataset.id)).toEqual(['arizona', 'missouri']);
  expect(datasets.every(dataset => dataset.records.length === 1)).toBe(true);
  await expect(loadEvaluationDatasets(async () => response(false, ''))).rejects.toThrow('Unable to load');
});
