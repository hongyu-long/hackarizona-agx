import { describe, expect, it } from 'vitest';
import { emptySetup, readSetup, validOrchard, validPoint, writeSetup, type Orchard } from './orchard';
const orchard: Orchard = { name: 'Almond block', location: { lat: 36.7, lng: -119.7 }, boundary: [], crop: '', treeHeightFt: null };
describe('Orchard setup data', () => {
  it('starts onboarding on first visit', () => { expect(readSetup({ getItem: () => null })).toEqual(emptySetup); });
  it('persists the profile and preferences without changing coordinates', () => { let raw = ''; const store = { getItem: () => raw, setItem: (_key: string, v: string) => { raw = v; } }; const setup = { version: 1 as const, completed: true, orchard, notifications: true }; writeSetup(store, setup); expect(readSetup(store)).toEqual(setup); });
  it('supports a completed skip without an invented orchard', () => { const value = { ...emptySetup, completed: true }; expect(readSetup({ getItem: () => JSON.stringify(value) })).toEqual(value); });
  it('accepts optional fields left empty', () => { expect(validOrchard(orchard)).toBe(true); });
  it.each([NaN, Infinity, 86, -86])('rejects unsupported latitude %s', lat => { expect(validPoint({ lat, lng: 0 })).toBe(false); });
  it('rejects invalid names, heights and coordinates', () => { for (const change of [{ name: '' }, { treeHeightFt: -1 }, { location: { lat: 0, lng: 181 } }]) expect(validOrchard({ ...orchard, ...change })).toBe(false); });
  it('requires a nondegenerate boundary or no boundary', () => { expect(validOrchard({ ...orchard, boundary: [{ lat: 1, lng: 1 }] })).toBe(false); expect(validOrchard({ ...orchard, boundary: [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, { lat: 3, lng: 3 }] })).toBe(false); expect(validOrchard({ ...orchard, boundary: [{ lat: 1, lng: 1 }, { lat: 2, lng: 1 }, { lat: 2, lng: 2 }] })).toBe(true); });
  it('surfaces corrupt storage without replacing it', () => { expect(() => readSetup({ getItem: () => '{' })).toThrow(); expect(() => readSetup({ getItem: () => JSON.stringify({ ...emptySetup, orchard: {} }) })).toThrow(); });
  it('propagates a storage failure instead of claiming a successful save', () => { expect(() => writeSetup({ setItem: () => { throw new Error('Blocked'); } }, { ...emptySetup, orchard })).toThrow('Blocked'); });
});
