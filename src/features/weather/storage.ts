import type { Config, Pair, Result } from './risk';
import type { LocatedSourceLevelReading, ObservationInterval, ReplayTimezone } from './historical';
export type Evaluation =
  | { id: string; scenario: string; evaluatedAt: string; source: 'simulated'; mode: 'snapshot'; pair: Pair; config: Config; result: Result }
  | { id: string; scenario: string; evaluatedAt: string; source: 'NEON'; mode: 'historical'; timezone: ReplayTimezone; site?: { id: string; name: string; latitude: number; longitude: number; timezone: string; ecosystem: string; dataNote: string }; attribution?: string; license?: 'CC BY 4.0'; observation: ObservationInterval; sourceReadings?: { lower: LocatedSourceLevelReading; upper: LocatedSourceLevelReading; levels: LocatedSourceLevelReading[] }; pair: Pair; config: Config; result: Result };
export const storageKey = 'spraywise.evaluations.v1';
export function readLog(storage: Pick<Storage, 'getItem'>): Evaluation[] {
  const raw = storage.getItem(storageKey);
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(v => v && typeof v.id === 'string' && typeof v.evaluatedAt === 'string' && ((v.source === 'simulated' && v.mode === 'snapshot') || (v.source === 'NEON' && v.mode === 'historical' && ['local', 'utc'].includes(v.timezone) && v.observation?.start && v.observation?.end && (v.site === undefined || typeof v.site?.id === 'string' && typeof v.site?.timezone === 'string') && (v.attribution === undefined || typeof v.attribution === 'string') && (v.license === undefined || v.license === 'CC BY 4.0') && (v.sourceReadings === undefined || v.sourceReadings.lower && v.sourceReadings.upper && Array.isArray(v.sourceReadings.levels)))) && v.pair?.lower && v.pair?.upper && v.config && ['GO','STOP','CAUTION','UNAVAILABLE'].includes(v.result?.status) && Array.isArray(v.result.alerts) && Array.isArray(v.result.errors))) throw new Error('Stored log is unreadable.');
  return value;
}
export function writeLog(storage: Pick<Storage, 'setItem'>, records: Evaluation[]) {
  if (records.length > 1000) throw new Error('Local log limit reached. Export records and clear the log to save more.');
  storage.setItem(storageKey, JSON.stringify(records));
}
