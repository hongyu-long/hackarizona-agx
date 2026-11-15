import type { Example } from './experiment';
export type WeatherContext = { site: string; validFrom: string; validTo: string; availableAt: string; cloudPercent: number; source: string; latitude: number; longitude: number; matchingMethod: string };
export function withWeatherContext(rows: Example[], input: unknown): Example[] {
  if (!Array.isArray(input)) throw new Error('Context must be an array.');
  const context: WeatherContext[] = input.map(value => {
    if (!value || typeof value !== 'object') throw new Error('Invalid weather context.');
    const c = value as Record<string, unknown>;
    if (!['site','source','matchingMethod'].every(k => typeof c[k] === 'string' && c[k]) || !['validFrom','validTo','availableAt'].every(k => typeof c[k] === 'string' && c[k].endsWith('Z') && Number.isFinite(Date.parse(c[k]))) || typeof c.cloudPercent !== 'number' || !Number.isFinite(c.cloudPercent) || c.cloudPercent < 0 || c.cloudPercent > 100 || typeof c.latitude !== 'number' || !Number.isFinite(c.latitude) || Math.abs(c.latitude) > 90 || typeof c.longitude !== 'number' || !Number.isFinite(c.longitude) || Math.abs(c.longitude) > 180 || Date.parse(String(c.validTo)) <= Date.parse(String(c.validFrom))) throw new Error('Invalid cloud context, source matching or times.');
    return c as WeatherContext;
  });
  return rows.flatMap(row => {
    const match = context.filter(c => c.site === row.site && Date.parse(c.availableAt) <= Date.parse(row.cutoff) && Date.parse(c.validFrom) <= Date.parse(row.cutoff) && Date.parse(c.validTo) > Date.parse(row.cutoff)).sort((a,b) => Date.parse(b.availableAt) - Date.parse(a.availableAt))[0];
    return match ? [{ ...row, features: [...row.features, match.cloudPercent] }] : [];
  });
}
