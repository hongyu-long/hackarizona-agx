import { defaults, evaluateRisk, type Config, type Pair, type Reading, type Result } from './risk';

export type ObservationInterval = { start: string; end: string };
export type ReplayTimezone = 'local' | 'utc';
export type SourceLevelReading = {
  id: string;
  temperatureC: number;
  temperatureQf: number;
  windSpeedMps: number;
  windDirectionDeg: number;
  windSpeedQf: number;
  windDirectionQf: number;
};
export type LocatedSourceLevelReading = SourceLevelReading & {
  heightM: number;
  windHeightM: number;
  temperatureSensorLocationId: string;
  temperatureSensorDescription: string;
  windSensorLocationId: string;
  windSensorDescription: string;
};
type HistoricalRecord = ObservationInterval & { levels: SourceLevelReading[] };
export type HistoricalCatalog = {
  schemaVersion: number;
  source: 'NEON';
  attribution: string;
  license: 'CC BY 4.0';
  productCodes: string[];
  variables: {
    temperature: { product: string; value: string; unit: string; qualityFlag: string };
    windSpeed: { product: string; value: string; unit: string; qualityFlag: string };
    windDirection: { product: string; value: string; unit: string; qualityFlag: string };
  };
  site: { id: string; name: string; latitude: number; longitude: number; timezone: string; ecosystem: string; dataNote: string };
  observationIntervalMinutes: number;
  levels: { id: string; heightM: number; sensorLocationId: string; description: string; wind: { heightM: number; sensorLocationId: string; description: string } }[];
  records: HistoricalRecord[];
};
export type Replay = {
  site: string;
  siteName: string;
  timezone: string;
  observation: ObservationInterval;
  levels: LocatedSourceLevelReading[];
  lower: LocatedSourceLevelReading;
  upper: LocatedSourceLevelReading;
};
export type ReplayEvaluation = {
  id: string;
  scenario: string;
  evaluatedAt: string;
  source: 'NEON';
  mode: 'historical';
  site: HistoricalCatalog['site'];
  attribution: string;
  license: 'CC BY 4.0';
  timezone: ReplayTimezone;
  observation: ObservationInterval;
  sourceReadings: { lower: LocatedSourceLevelReading; upper: LocatedSourceLevelReading; levels: LocatedSourceLevelReading[] };
  pair: Pair;
  config: typeof defaults;
  result: Result;
};

const metersPerSecondToMph = 2.2369362921;
const metersToFeet = 3.280839895;

export function queryObservationAtHeight(catalog: HistoricalCatalog, siteId: string, start: string, levelId: string): { site: HistoricalCatalog['site']; observation: ObservationInterval; level: LocatedSourceLevelReading } {
  if (siteId !== catalog.site.id) throw new Error(`No local historical site with id ${siteId}.`);
  const record = catalog.records.find(item => item.start === start);
  if (!record) throw new Error(`No observation interval starts at ${start}.`);
  const source = record.levels.find(item => item.id === levelId);
  if (!source) throw new Error(`No observation at level ${levelId} starts at ${start}.`);
  const position = catalog.levels.find(item => item.id === levelId);
  if (!position) throw new Error(`Sensor-position metadata is missing for level ${levelId}.`);
  return { site: catalog.site, observation: { start: record.start, end: record.end }, level: locatedLevel(source, position) };
}

export function queryReplay(catalog: HistoricalCatalog, start: string): Replay {
  const record = catalog.records.find(item => item.start === start);
  if (!record) throw new Error(`No observation interval starts at ${start}.`);
  const levels = record.levels.map(level => {
    const position = catalog.levels.find(item => item.id === level.id);
    if (!position) throw new Error(`Sensor-position metadata is missing for level ${level.id}.`);
    return locatedLevel(level, position);
  }).sort((a, b) => a.heightM - b.heightM);
  if (levels.length < 2) throw new Error(`At least two matched sensor levels are required at ${start}.`);
  const lower = levels[0];
  const upper = levels[levels.length - 1];
  return {
    site: catalog.site.id,
    siteName: catalog.site.name,
    timezone: catalog.site.timezone,
    observation: { start: record.start, end: record.end },
    levels,
    lower,
    upper
  };
}

function locatedLevel(source: SourceLevelReading, position: HistoricalCatalog['levels'][number]): LocatedSourceLevelReading {
  return {
    ...source,
    heightM: position.heightM,
    windHeightM: position.wind.heightM,
    temperatureSensorLocationId: position.sensorLocationId,
    temperatureSensorDescription: position.description,
    windSensorLocationId: position.wind.sensorLocationId,
    windSensorDescription: position.wind.description
  };
}

export function formatReplayTimestamp(timestamp: string, timezone: string, display: ReplayTimezone): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: display === 'utc' ? 'UTC' : timezone,
    timeZoneName: 'short'
  }).format(new Date(timestamp));
}

const localDateTimeFormatter = (timezone: string) => new Intl.DateTimeFormat('en-US', {
  timeZone: timezone,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

export function formatLocationDateTimeInput(timestamp: string, timezone: string): string {
  const parts = Object.fromEntries(localDateTimeFormatter(timezone).formatToParts(new Date(timestamp)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function locationDateTimeToUtc(value: string, timezone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const requested = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = requested;
  const formatter = localDateTimeFormatter(timezone);
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map(part => [part.type, Number(part.value)]));
    candidate += requested - Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  }
  if (formatLocationDateTimeInput(new Date(candidate).toISOString(), timezone) !== value) return null;
  return new Date(candidate).toISOString();
}

export function nearestReplayIndex(catalog: HistoricalCatalog, timestamp: string): number {
  const target = Date.parse(timestamp);
  const records = catalog.records;
  if (!Number.isFinite(target) || !records.length) return -1;
  let low = 0;
  let high = records.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (Date.parse(records[middle].start) < target) low = middle + 1;
    else high = middle;
  }
  if (low > 0 && Math.abs(target - Date.parse(records[low - 1].start)) <= Math.abs(Date.parse(records[low].start) - target)) return low - 1;
  return low;
}

function reading(site: string, value: LocatedSourceLevelReading, observedAt: string): Reading {
  const qualityOk = value.temperatureQf === 0 && value.windSpeedQf === 0 && value.windDirectionQf === 0;
  return {
    id: `${site}-${value.id}`,
    site,
    heightFt: value.heightM * metersToFeet,
    temperatureC: qualityOk ? value.temperatureC : null,
    speedMph: qualityOk ? value.windSpeedMps * metersPerSecondToMph : null,
    directionDeg: qualityOk ? value.windDirectionDeg : null,
    observedAt,
    heightM: value.heightM,
    windHeightM: value.windHeightM,
    windHeightFt: value.windHeightM * metersToFeet,
    qualityFlag: qualityOk ? 0 : Math.max(value.temperatureQf, value.windSpeedQf, value.windDirectionQf)
  };
}

export function assessReplay(catalog: HistoricalCatalog, start: string, evaluatedAt = new Date().toISOString(), config: Config = defaults, timezone: ReplayTimezone = 'local'): ReplayEvaluation {
  const replay = queryReplay(catalog, start);
  const pair: Pair = {
    lower: reading(replay.site, replay.lower, replay.observation.start),
    upper: reading(replay.site, replay.upper, replay.observation.start)
  };
  const result = evaluateRisk(pair, config, Date.parse(replay.observation.start));
  return {
    id: crypto.randomUUID(),
    scenario: `${replay.siteName} historical replay`,
    evaluatedAt,
    source: 'NEON',
    mode: 'historical',
    site: { ...catalog.site },
    attribution: 'National Ecological Observatory Network (NEON), DP1.00002.001 and DP1.00001.001, SRER, June 2024.',
    license: 'CC BY 4.0',
    timezone,
    observation: replay.observation,
    sourceReadings: { lower: { ...replay.lower }, upper: { ...replay.upper }, levels: replay.levels.map(level => ({ ...level })) },
    pair,
    config: { ...config },
    result
  };
}

export function formatObservationTime(interval: ObservationInterval, timezone: string, display: ReplayTimezone): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: display === 'utc' ? 'UTC' : timezone,
    timeZoneName: 'short'
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  return `${formatter.format(new Date(interval.start))} – ${formatter.format(new Date(interval.end))}`;
}
