import { describe, expect, it } from 'vitest';
import { queryReplay, queryObservationAtHeight, assessReplay, formatObservationTime, formatReplayTimestamp, formatLocationDateTimeInput, locationDateTimeToUtc, nearestReplayIndex, type HistoricalCatalog } from './historical';
import sample from '../../data/srer-historical.json';
import { readLog, writeLog } from './storage';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HistoricalReplayPage } from '../../pages/HistoricalReplayPage';
import { defaults } from './risk';

const catalog = sample as HistoricalCatalog;

describe('Arizona historical replay', () => {
  it('queries the lowest and highest actual levels at a selected interval', () => {
    const replay = queryReplay(catalog, '2024-06-01T02:00:00Z');
    expect(replay).toMatchObject({
      site: 'SRER',
      observation: { start: '2024-06-01T02:00:00Z', end: '2024-06-01T02:30:00Z' },
      lower: { id: '000.010', heightM: 0.25, windHeightM: 0.23, temperatureC: 31.7628, windSpeedMps: expect.any(Number) },
      upper: { id: '000.030', heightM: 3.9, windHeightM: 3.87, temperatureC: 32.1013, windSpeedMps: expect.any(Number) },
      levels: expect.arrayContaining([expect.objectContaining({ id: '000.020', heightM: 1.64, windHeightM: 1.62 })])
    });
  });

  it('queries real temperature and wind readings by site, interval, and sensor height', () => {
    const result = queryObservationAtHeight(catalog, 'SRER', '2024-06-01T02:00:00Z', '000.020');
    expect(result).toMatchObject({
      site: { id: 'SRER' },
      observation: { start: '2024-06-01T02:00:00Z', end: '2024-06-01T02:30:00Z' },
      level: { id: '000.020', heightM: 1.64, windHeightM: 1.62, temperatureSensorLocationId: 'CFGLOC104464', windSensorLocationId: 'CFGLOC104465', temperatureC: 31.8361, windSpeedMps: 1.34, windDirectionDeg: 246.13, temperatureQf: 0, windSpeedQf: 0, windDirectionQf: 0 }
    });
    expect(() => queryObservationAtHeight(catalog, 'SJER', '2024-06-01T02:00:00Z', '000.020')).toThrow('No local historical site');
  });

  it('assesses historical readings at observation time and stores a separate evaluation time', () => {
    const entry = assessReplay(catalog, '2024-06-01T02:00:00Z', '2026-11-15T12:00:00Z');
    expect(entry.evaluatedAt).toBe('2026-11-15T12:00:00Z');
    expect(entry.observation).toEqual({ start: '2024-06-01T02:00:00Z', end: '2024-06-01T02:30:00Z' });
    expect(entry.result).toMatchObject({ status: 'STOP', alerts: expect.arrayContaining([expect.objectContaining({ code: 'INVERSION' })]) });
    expect(entry.source).toBe('NEON');
  });

  it('formats the same observation interval in site-local time and UTC', () => {
    const observation = { start: '2024-06-01T12:30:00Z', end: '2024-06-01T13:00:00Z' };
    expect(formatObservationTime(observation, 'America/Phoenix', 'local')).toContain('05:30');
    expect(formatObservationTime(observation, 'America/Phoenix', 'utc')).toContain('12:30');
  });

  it('formats evaluation timestamps with the selected timezone and timezone name', () => {
    const timestamp = '2024-06-01T12:30:45Z';
    const local = formatReplayTimestamp(timestamp, 'America/Phoenix', 'local');
    const utc = formatReplayTimestamp(timestamp, 'America/Phoenix', 'utc');
    expect(local).toContain('5:30:45');
    expect(local).toContain('MST');
    expect(utc).toContain('12:30:45');
    expect(utc).toContain('UTC');
  });

  it('selects the nearest Arizona observation from a location-local date and time', () => {
    const local = formatLocationDateTimeInput('2024-06-01T12:30:00Z', 'America/Phoenix');
    const utc = locationDateTimeToUtc(local, 'America/Phoenix');
    expect(local).toBe('2024-06-01T05:30');
    expect(utc).toBe('2024-06-01T12:30:00.000Z');
    expect(nearestReplayIndex(catalog, utc!)).toBe(25);
    expect(locationDateTimeToUtc('2024-03-10T02:30', 'America/New_York')).toBeNull();
  });

  it('keeps the selected time preference and full site metadata in evidence', () => {
    const entry = assessReplay(catalog, '2024-06-01T02:00:00Z', '2026-11-15T12:00:00Z', undefined, 'utc');
    expect(entry).toMatchObject({
      timezone: 'utc',
      site: { id: 'SRER', timezone: 'America/Phoenix', ecosystem: 'Shrubland' },
      sourceReadings: { levels: expect.arrayContaining([expect.objectContaining({ id: '000.020', heightM: 1.64, windHeightM: 1.62 })]) },
      attribution: expect.stringContaining('NEON'),
      license: 'CC BY 4.0'
    });
  });

  it('persists and reloads a complete historical evidence record', () => {
    const entry = assessReplay(catalog, '2024-06-01T02:00:00Z', '2026-11-15T12:00:00Z', undefined, 'utc');
    let saved: string | null = null;
    const storage = { getItem: () => saved, setItem: (_key: string, value: string) => { saved = value; } };
    writeLog(storage, [entry]);
    expect(readLog(storage)).toEqual([entry]);
  });

  it('continues to load earlier locally saved historical evidence', () => {
    const entry = assessReplay(catalog, '2024-06-01T02:00:00Z', '2026-11-15T12:00:00Z');
    const { site, sourceReadings, attribution, license, ...previousEntry } = entry;
    expect(site.id).toBe('SRER');
    expect(sourceReadings.levels).toHaveLength(3);
    expect(attribution).toContain('NEON');
    expect(license).toBe('CC BY 4.0');
    const loaded = readLog({ getItem: () => JSON.stringify([previousEntry]) });
    expect(loaded[0]).toMatchObject({ source: 'NEON', observation: entry.observation, pair: entry.pair });
  });

  it('renders the real Arizona replay controls, readings, status, and source attribution', () => {
    const html = renderToStaticMarkup(React.createElement(HistoricalReplayPage, {
      config: defaults,
      timeDisplay: 'local',
      onTimeDisplayChange: () => {},
      onSave: () => {}
    }));
    expect(html).toContain('Arizona historical replay');
    expect(html).toContain('type="datetime-local"');
    expect(html).toContain('aria-label="Historical interval"');
    expect(html).toContain('LOWEST AVAILABLE LEVEL');
    expect(html).toContain('HIGHEST AVAILABLE LEVEL');
    expect(html).toContain('31.7628');
    expect(html).toContain('NEON');
    expect(html).toContain('Assess &amp; save log');
  });

  it('returns unavailable for a timestamp absent from the local catalog', () => {
    expect(() => queryReplay(catalog, '2024-05-01T00:00:00Z')).toThrow('No observation interval');
  });
});



it('keeps the complete Arizona time series in ordered 30-minute intervals', () => {
  expect(catalog.records).toHaveLength(1440);
  expect(catalog.levels.map(level => level.id)).toEqual(['000.010', '000.020', '000.030']);
  expect(catalog.variables).toMatchObject({
    temperature: { product: 'DP1.00002.001', value: 'tempSingleMean', unit: 'degree_C', qualityFlag: 'finalQF' },
    windSpeed: { product: 'DP1.00001.001', value: 'windSpeedMean', unit: 'm/s', qualityFlag: 'windSpeedFinalQF' },
    windDirection: { product: 'DP1.00001.001', value: 'windDirMean', unit: 'degree', qualityFlag: 'windDirFinalQF' }
  });
  expect(catalog.attribution).toContain('National Ecological Observatory Network');
  expect(catalog.license).toBe('CC BY 4.0');
  for (let index = 0; index < catalog.records.length; index += 1) {
    const item = catalog.records[index];
    expect(Date.parse(item.end) - Date.parse(item.start)).toBe(30 * 60 * 1000);
    expect(item.levels.map(level => level.id)).toEqual(['000.010', '000.020', '000.030']);
    if (index > 0) expect(Date.parse(item.start)).toBe(Date.parse(catalog.records[index - 1].start) + 30 * 60 * 1000);
  }
});

it('marks quality-flagged historical input unavailable', () => {
  const flagged = structuredClone(catalog);
  flagged.records[4].levels[2].windDirectionQf = 1;
  expect(assessReplay(flagged, '2024-06-01T02:00:00Z').result.status).toBe('UNAVAILABLE');
});

