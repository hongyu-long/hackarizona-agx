export type Point = { lat: number; lng: number };
export type Orchard = { name: string; location: Point; boundary: Point[]; crop: string; treeHeightFt: number | null };
export type Setup = { version: 1; completed: boolean; orchard: Orchard | null; notifications: boolean };
export const setupKey = 'spraywise.setup.v1';
export const emptySetup: Setup = { version: 1, completed: false, orchard: null, notifications: false };
export function validPoint(p: unknown): p is Point {
  const v = p as Point | null;
  return !!v && Number.isFinite(v.lat) && Math.abs(v.lat) <= 85 && Number.isFinite(v.lng) && Math.abs(v.lng) <= 180;
}
export function validOrchard(o: unknown): o is Orchard {
  const v = o as Orchard | null;
  return !!v && typeof v.name === 'string' && !!v.name.trim() && v.name.length <= 100 && validPoint(v.location) &&
    typeof v.crop === 'string' && v.crop.length <= 100 && (v.treeHeightFt === null || (Number.isFinite(v.treeHeightFt) && v.treeHeightFt > 0)) &&
    Array.isArray(v.boundary) && (v.boundary.length === 0 || v.boundary.length >= 3) && v.boundary.every(validPoint) &&
    (v.boundary.length === 0 || Math.abs(v.boundary.reduce((sum, p, i, a) => sum + p.lng * a[(i + 1) % a.length].lat - a[(i + 1) % a.length].lng * p.lat, 0)) > 1e-12);
}
export function readSetup(store: Pick<Storage, 'getItem'>): Setup {
  const raw = store.getItem(setupKey);
  if (!raw) return { ...emptySetup };
  const value = JSON.parse(raw);
  if (value?.version !== 1 || typeof value.completed !== 'boolean' || typeof value.notifications !== 'boolean' || (value.orchard !== null && !validOrchard(value.orchard))) throw new Error('Saved orchard settings are unreadable. Clear them explicitly to replace them.');
  return value;
}
export function writeSetup(store: Pick<Storage, 'setItem'>, setup: Setup) {
  if (setup.orchard !== null && !validOrchard(setup.orchard)) throw new Error('Check orchard name, coordinates, tree height and boundary (at least three non-collinear points).');
  store.setItem(setupKey, JSON.stringify(setup));
}
export function exportSetup(setup: Setup) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(setup, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'to-spray-or-not-to-spray-orchard.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
