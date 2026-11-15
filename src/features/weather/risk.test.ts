import { describe, expect, it } from 'vitest';
import { angularDifference, defaults, evaluateRisk, type Pair } from './risk';
import { readLog, writeLog, type Evaluation } from './storage';
const now = Date.parse('2026-11-15T12:00:00Z');
function pair(): Pair { return { lower: { id: 'l', site: 's', heightFt: 5, temperatureC: 22, speedMph: 5, directionDeg: 90, observedAt: new Date(now).toISOString() }, upper: { id: 'u', site: 's', heightFt: 30, temperatureC: 20, speedMph: 6, directionDeg: 110, observedAt: new Date(now).toISOString() } }; }
describe('Multi-height weather screening', () => {
  it('reports GO only when no configured flags are found', () => { expect(evaluateRisk(pair(), defaults, now)).toMatchObject({ status: 'GO', alerts: [], deltaTemperature: -2, deltaSpeed: 1, deltaDirection: 20 }); });
  it('detects hidden inversion despite acceptable ground wind', () => { const p = pair(); p.upper.temperatureC = 26; expect(evaluateRisk(p, defaults, now)).toMatchObject({ status: 'STOP', alerts: [{ code: 'INVERSION' }] }); });
  it('does not call equal temperatures an inversion', () => { const p = pair(); p.upper.temperatureC = 22; expect(evaluateRisk(p, defaults, now).status).toBe('GO'); });
  it.each([['lower', 2.99, true], ['lower', 3, false], ['upper', 10, false], ['upper', 10.01, true]] as const)('wind bound at %s %s mph', (height, speed, flag) => { const p = pair(); p.lower.speedMph = speed; p.upper.speedMph = speed; const r = evaluateRisk(p, defaults, now); expect(r.alerts.some(a => a.code === `${height.toUpperCase()}_${speed < 3 ? 'LOW' : 'HIGH'}_WIND`)).toBe(flag); });
  it.each([[3.99, 'GO'], [4, 'CAUTION'], [6.99, 'CAUTION'], [7, 'STOP']] as const)('speed shear boundary %s', (difference, status) => { const p = pair(); p.lower.speedMph = 3; p.upper.speedMph = 3 + difference; expect(evaluateRisk(p, defaults, now).status).toBe(status); });
  it.each([[44.99, 'GO'], [45, 'CAUTION'], [89.99, 'CAUTION'], [90, 'STOP']] as const)('direction boundary %s', (difference, status) => { const p = pair(); p.lower.directionDeg = 0; p.upper.directionDeg = difference; expect(evaluateRisk(p, defaults, now).status).toBe(status); });
  it('uses circular angles, including north at 360 degrees', () => { expect(angularDifference(350, 10)).toBe(20); expect(angularDifference(360, 0)).toBe(0); });
  it('retains simultaneous alerts', () => { const p = pair(); p.upper.temperatureC = 25; p.upper.speedMph = 12; p.upper.directionDeg = 200; expect(evaluateRisk(p, defaults, now).alerts.map(a => a.code)).toEqual(['INVERSION', 'UPPER_HIGH_WIND', 'SPEED_SHEAR', 'DIRECTION_SHEAR']); });
  it.each([null, NaN, Infinity])('missing or nonfinite temperature never gives GO (%s)', value => { const p = pair(); p.upper.temperatureC = value; expect(evaluateRisk(p, defaults, now).status).toBe('UNAVAILABLE'); });
  it('rejects negative wind', () => { const p = pair(); p.upper.speedMph = -1; expect(evaluateRisk(p, defaults, now).status).toBe('UNAVAILABLE'); });
  it('requires direction at normal wind, but can still flag calm wind without direction', () => { const p = pair(); p.upper.directionDeg = null; expect(evaluateRisk(p, defaults, now).status).toBe('UNAVAILABLE'); p.upper.speedMph = 1; expect(evaluateRisk(p, defaults, now)).toMatchObject({ status: 'STOP', deltaDirection: null }); });
  it('rejects stale data but accepts exact freshness boundary', () => { expect(evaluateRisk(pair(), defaults, now + 120000).status).toBe('GO'); expect(evaluateRisk(pair(), defaults, now + 120001).status).toBe('UNAVAILABLE'); });
  it('rejects mismatched timestamps and future dates', () => { const p = pair(); p.upper.observedAt = new Date(now - 61000).toISOString(); expect(evaluateRisk(p, defaults, now).status).toBe('UNAVAILABLE'); p.upper.observedAt = new Date(now + 5001).toISOString(); expect(evaluateRisk(p, defaults, now).status).toBe('UNAVAILABLE'); });
  it('rejects duplicate sensors, different sites, and reversed heights', () => { for (const change of [{ id: 'l' }, { site: 'other' }, { heightFt: 4 }]) { const p = pair(); Object.assign(p.upper, change); expect(evaluateRisk(p, defaults, now).status).toBe('UNAVAILABLE'); } });
  it('supports changed thresholds without changing default rules', () => { const p = pair(); p.upper.directionDeg = 140; expect(evaluateRisk(p, { ...defaults, directionCaution: 60 }, now).status).toBe('GO'); expect(evaluateRisk(p, defaults, now).status).toBe('CAUTION'); });
  it('is deterministic and does not mutate inputs', () => { const p = pair(); const copy = JSON.stringify(p); expect(evaluateRisk(p, defaults, now)).toEqual(evaluateRisk(p, defaults, now)); expect(JSON.stringify(p)).toBe(copy); });
  it('invalid configuration cannot produce a recommendation', () => { expect(evaluateRisk(pair(), { ...defaults, speedStop: 2 }, now).status).toBe('UNAVAILABLE'); });
});
describe('Evidence persistence', () => {
  const p = pair(); const entry: Evaluation = { id: '1', evaluatedAt: new Date(now).toISOString(), scenario: 'baseline', source: 'simulated', mode: 'snapshot', pair: p, config: defaults, result: evaluateRisk(p, defaults, now) };
  it('round-trips all input, configuration and result evidence', () => { let saved: string | null = null; const store = { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } }; expect(readLog(store)).toEqual([]); writeLog(store, [entry]); expect(readLog(store)).toEqual([entry]); });
  it('surfaces unavailable storage rather than claiming success', () => { expect(() => writeLog({ setItem: () => { throw new Error('Quota exceeded'); } }, [entry])).toThrow('Quota exceeded'); });
  it('rejects corrupted records', () => { expect(() => readLog({ getItem: () => '[{}]' })).toThrow(); expect(() => readLog({ getItem: () => '{' })).toThrow(); });
  it('never silently evicts records at the limit', () => { let wrote = false; expect(() => writeLog({ setItem: () => { wrote = true; } }, Array(1001).fill(entry))).toThrow('limit'); expect(wrote).toBe(false); });
});
