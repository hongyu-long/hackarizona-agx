import { validProvenance, type Provenance } from './experiment.ts';
type Evidence = { schemaVersion: 1; site: string; cutoff: string; targetEnd: string; generatedAt: string; source: string; inputReferences: string[]; limitations: string[] };
export type Forecast = Evidence & (
  | { state: 'unavailable'; reason: string; provenance?: never }
  | { state: 'available'; provenance: Provenance; variant: 'tower' | 'context'; reliability: 'uncalibrated'; inputQuality: 'passed'; modelVersion: string; prediction: 0 | 1 } & (
    | { predictor: 'persistence'; probability?: never }
    | { predictor: 'TabPFN'; probability: number }
  ));
const key = 'spraywise.forecasts.v1';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === 'string' && s.length > 0);
const time = (v: unknown): v is string => typeof v === 'string' && v.endsWith('Z') && Number.isFinite(Date.parse(v));
export function parseForecast(value: unknown): Forecast {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid forecast evidence.');
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== 1 || typeof v.site !== 'string' || !v.site || typeof v.source !== 'string' || !v.source || !time(v.cutoff) || !time(v.targetEnd) || !time(v.generatedAt) || Date.parse(v.targetEnd) - Date.parse(v.cutoff) !== 1800000 || !strings(v.inputReferences) || !strings(v.limitations)) throw new Error('Invalid forecast metadata or interval.');
  if (v.state === 'unavailable') {
    if (typeof v.reason !== 'string' || !v.reason || 'probability' in v || 'prediction' in v) throw new Error('Invalid unavailable forecast.');
  } else if (v.state === 'available') {
    if (!validProvenance(v.provenance) || v.provenance.inputs[1].end !== v.cutoff) throw new Error('Missing or invalid input provenance.');
    if (!['tower','context'].includes(String(v.variant)) || v.reliability !== 'uncalibrated' || v.inputQuality !== 'passed' || typeof v.modelVersion !== 'string' || !v.modelVersion || (v.prediction !== 0 && v.prediction !== 1) || !v.inputReferences.length) throw new Error('Invalid forecast result.');
    if (v.predictor === 'persistence') { if ('probability' in v) throw new Error('Persistence does not supply probability.'); }
    else if (v.predictor === 'TabPFN') { if (typeof v.probability !== 'number' || !Number.isFinite(v.probability) || v.probability < 0 || v.probability > 1) throw new Error('Invalid inversion probability.'); }
    else throw new Error('Unknown predictor.');
  } else throw new Error('Unknown forecast state.');
  return structuredClone(value) as Forecast;
}
export function loadForecasts(storage: Pick<Storage, 'getItem'>): Forecast[] {
  const raw = storage.getItem(key);
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || value.length > 1000) throw new Error('Invalid forecast archive; preserved without overwrite.');
  return value.map(parseForecast);
}
export function saveForecast(storage: Pick<Storage, 'getItem' | 'setItem'>, value: Forecast) {
  const current = loadForecasts(storage);
  if (current.length >= 1000) throw new Error('Forecast archive full; export before clearing.');
  storage.setItem(key, JSON.stringify([...current, parseForecast(value)]));
}
