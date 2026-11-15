export type Example = { id: string; site: string; cutoff: string; inputEnd: string; targetEnd: string; features: number[]; label: 0 | 1; persistence: 0 | 1; transition: 'onset' | 'dissipation' | 'stable'; provenance: Provenance };
export type Provenance = { attribution: string; license: string; ecosystem: string; temperatureHeightsM: number[]; windHeightsM: number[]; units: 'C,m/s,degrees'; inputs: Interval[] };
type Level = { temperatureC: number; temperatureQf: number; windSpeedMps: number; windSpeedQf: number; windDirectionDeg: number; windDirectionQf: number };
type Interval = { start: string; end: string; lower: Level; upper: Level };
type Catalog = { site: { id: string; ecosystem: string }; records: Interval[]; attribution: string; license: string; observationIntervalMinutes: number; levels: { id: string; heightM: number; wind: { heightM: number } }[] };
const step = 30 * 60 * 1000;
const radians = (degrees: number) => degrees * Math.PI / 180;
const extractors: Record<string, (current: Interval, previous: Interval) => number> = {
  lowerTemperatureC: c => c.lower.temperatureC, upperTemperatureC: c => c.upper.temperatureC,
  lowerWindMps: c => c.lower.windSpeedMps, upperWindMps: c => c.upper.windSpeedMps,
  lowerDirectionSin: c => Math.sin(radians(c.lower.windDirectionDeg)), lowerDirectionCos: c => Math.cos(radians(c.lower.windDirectionDeg)),
  upperDirectionSin: c => Math.sin(radians(c.upper.windDirectionDeg)), upperDirectionCos: c => Math.cos(radians(c.upper.windDirectionDeg)),
  temperatureDifference: c => c.upper.temperatureC - c.lower.temperatureC,
  lowerTemperatureChange: (c,p) => c.lower.temperatureC - p.lower.temperatureC,
  upperTemperatureChange: (c,p) => c.upper.temperatureC - p.upper.temperatureC
};
const measurementHeightFeatureNames = ['lowerTemperatureHeightM', 'upperTemperatureHeightM', 'lowerWindHeightM', 'upperWindHeightM'];
export const featureNames = [...Object.keys(extractors), ...measurementHeightFeatureNames];
function object(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v); }
function level(v: unknown): v is Level {
  return object(v) && ['temperatureC','temperatureQf','windSpeedMps','windSpeedQf','windDirectionDeg','windDirectionQf'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]));
}
function usable(v: Level) { return v.temperatureQf === 0 && v.windSpeedQf === 0 && v.windDirectionQf === 0 && v.windSpeedMps >= 0 && v.windDirectionDeg >= 0 && v.windDirectionDeg <= 360; }
export function validProvenance(v: unknown): v is Provenance {
  if (!object(v) || !['attribution','license','ecosystem'].every(k => typeof v[k] === 'string' && v[k]) || v.units !== 'C,m/s,degrees') return false;
  for (const k of ['temperatureHeightsM','windHeightsM']) if (!Array.isArray(v[k]) || v[k].length !== 2 || !v[k].every((n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0) || v[k][0] >= v[k][1]) return false;
  return Array.isArray(v.inputs) && v.inputs.length === 2 && v.inputs.every(r => object(r) && typeof r.start === 'string' && r.start.endsWith('Z') && typeof r.end === 'string' && r.end.endsWith('Z') && Number.isFinite(Date.parse(r.start)) && Date.parse(r.end) - Date.parse(r.start) === step && level(r.lower) && level(r.upper) && usable(r.lower) && usable(r.upper)) && v.inputs[0].end === v.inputs[1].start;
}
function catalog(v: unknown): Catalog {
  if (!object(v) || !object(v.site) || typeof v.site.id !== 'string' || !v.site.id || v.observationIntervalMinutes !== 30 || typeof v.attribution !== 'string' || typeof v.license !== 'string' || !Array.isArray(v.records)) throw new Error('Invalid 30-minute source catalog.');
  if (typeof v.site.ecosystem !== 'string' || !Array.isArray(v.levels) || v.levels.length < 2 || !v.levels.every(p => object(p) && typeof p.heightM === 'number' && object(p.wind) && typeof p.wind.heightM === 'number') || !object(v.variables) || !object(v.variables.temperature) || v.variables.temperature.unit !== 'degree_C' || !object(v.variables.windSpeed) || v.variables.windSpeed.unit !== 'm/s' || !object(v.variables.windDirection) || v.variables.windDirection.unit !== 'degree') throw new Error('Missing source heights, ecosystem or canonical units.');
  // Normalize the multi-level catalog at the import boundary, preserving its source.
  if (Array.isArray(v.levels) && v.records.every(r => object(r) && Array.isArray(r.levels))) {
    const positions = v.levels;
    if (positions.length < 2 || !positions.every(p => object(p) && typeof p.id === 'string' && typeof p.heightM === 'number' && Number.isFinite(p.heightM))) throw new Error('Invalid sensor positions.');
    const sorted = [...positions].sort((a, b) => a.heightM - b.heightM);
    if (sorted[0].heightM >= sorted[sorted.length - 1].heightM) throw new Error('Distinct heights required.');
    v = { ...v, records: v.records.map(r => ({ ...r, lower: r.levels.find((l: Record<string, unknown>) => l.id === sorted[0].id), upper: r.levels.find((l: Record<string, unknown>) => l.id === sorted[sorted.length - 1].id) })) };
  }
  const normalized = v as Record<string, unknown> & { records: unknown[] };
  let previous = -Infinity;
  for (const r of normalized.records) {
    if (!object(r) || typeof r.start !== 'string' || typeof r.end !== 'string' || !r.start.endsWith('Z') || !r.end.endsWith('Z') || !Number.isFinite(Date.parse(r.start)) || Date.parse(r.start) < previous || Date.parse(r.end) - Date.parse(r.start) !== step || !level(r.lower) || !level(r.upper)) throw new Error('Invalid, duplicated or unordered source interval.');
    if (Date.parse(r.start) < previous) throw new Error('Overlapping source intervals.');
    previous = Date.parse(r.end);
  }
  if (!normalized.records.length) throw new Error('Empty source catalog.');
  return v as unknown as Catalog;
}
export function buildExperiment(inputs: unknown[]) {
  if (!inputs.length || inputs.length > 2) throw new Error('Provide one or two source catalogs.');
  const catalogs = inputs.map(catalog);
  if (new Set(catalogs.map(c => c.site.id)).size !== catalogs.length) throw new Error('Duplicate site.');
  // One shared chronological window prevents training on a later site's dates.
  const start = Math.max(...catalogs.map(c => Date.parse(c.records[0].start)));
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const split = { validationStart: start + 4 * 86400000, testStart: start + 5 * 86400000, end };
  const examples: Example[] = [];
  let rawRecords = 0;
  for (const c of catalogs) {
    const records = c.records.filter(r => Date.parse(r.start) >= start && Date.parse(r.end) <= end);
    rawRecords += records.length;
    for (let i = 1; i < records.length - 1; i++) {
      const previous = records[i - 1], current = records[i], future = records[i + 1];
      if (previous.end !== current.start || current.end !== future.start || ![previous, current, future].every(r => usable(r.lower) && usable(r.upper))) continue;
      const label = future.upper.temperatureC > future.lower.temperatureC ? 1 : 0;
      const persistence = current.upper.temperatureC > current.lower.temperatureC ? 1 : 0;
      const positions = [...c.levels].sort((a,b) => a.heightM - b.heightM);
      const provenance: Provenance = { attribution: c.attribution, license: c.license, ecosystem: c.site.ecosystem, temperatureHeightsM: [positions[0].heightM, positions.at(-1)!.heightM], windHeightsM: [positions[0].wind.heightM, positions.at(-1)!.wind.heightM], units: 'C,m/s,degrees', inputs: [previous, current].map(r => ({ start: r.start, end: r.end, lower: { ...r.lower }, upper: { ...r.upper } })) };
      if (!validProvenance(provenance)) throw new Error('Invalid input provenance.');
      examples.push({ id: `${c.site.id}/${current.end}`, site: c.site.id, cutoff: current.end, inputEnd: current.end, targetEnd: future.end, label, persistence, provenance,
        transition: label === persistence ? 'stable' : label ? 'onset' : 'dissipation',
        features: [...Object.values(extractors).map(extract => extract(current, previous)), positions[0].heightM, positions.at(-1)!.heightM, positions[0].wind.heightM, positions.at(-1)!.wind.heightM] });
    }
  }
  if (rawRecords > 672) throw new Error('Raw sample budget exceeded.');
  const train = examples.filter(r => Date.parse(r.targetEnd) <= split.validationStart);
  const validation = examples.filter(r => Date.parse(r.cutoff) >= split.validationStart && Date.parse(r.targetEnd) <= split.testStart);
  const test = examples.filter(r => Date.parse(r.cutoff) >= split.testStart && Date.parse(r.targetEnd) <= end);
  return { schemaVersion: 1, featureNames, rawRecords, examples, train, validation, test, split,
    sources: catalogs.map(c => ({ site: c.site.id, attribution: c.attribution, license: c.license })),
    limitations: [...(catalogs.length < 2 ? [`Only ${catalogs.length} site available; two-site requirement is unmet.`] : []), ...(rawRecords < catalogs.length * 336 ? ['Source coverage does not span the complete seven-day window.'] : []), 'Cloud comparison unavailable: no context with verified issue time supplied.', 'Historical pseudo-forecast; observation publication latency is not verified.', 'Uncalibrated small-sample experiment; not orchard validation.'] };
}

export function score(rows: Example[], predictions: number[]) {
  if (rows.length !== predictions.length || predictions.some(p => p !== 0 && p !== 1)) throw new Error('Predictions must align with every evaluation case.');
  let missed = 0, falseAlarms = 0, positives = 0;
  rows.forEach((r, i) => { positives += r.label; if (r.label && !predictions[i]) missed++; if (!r.label && predictions[i]) falseAlarms++; });
  return { cases: rows.length, positives, negatives: rows.length - positives, missed, falseAlarms, accuracy: rows.length ? 1 - (missed + falseAlarms) / rows.length : null,
    onset: rows.filter(r => r.transition === 'onset').length, dissipation: rows.filter(r => r.transition === 'dissipation').length,
    onsetErrors: rows.filter((r, i) => r.transition === 'onset' && r.label !== predictions[i]).length,
    dissipationErrors: rows.filter((r, i) => r.transition === 'dissipation' && r.label !== predictions[i]).length,
    transitionErrors: rows.filter((r, i) => r.transition !== 'stable' && r.label !== predictions[i]).length };
}

