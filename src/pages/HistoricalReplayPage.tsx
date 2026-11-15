import { useState } from 'react';
import { historicalCatalog as catalog } from '../data/historical';
import { assessReplay, formatLocationDateTimeInput, formatObservationTime, formatReplayTimestamp, locationDateTimeToUtc, nearestReplayIndex, type ReplayTimezone } from '../features/weather/historical';
import type { Config } from '../features/weather/risk';

type Props = {
  config: Config;
  timeDisplay: ReplayTimezone;
  onTimeDisplayChange: (value: ReplayTimezone) => void;
  onSave: (start: string, display: ReplayTimezone) => void;
};

function SensorReading({ label, reading, source }: { label: string; reading: ReturnType<typeof assessReplay>['pair']['lower']; source: ReturnType<typeof assessReplay>['sourceReadings']['lower'] }) {
  return <article className="sensor historical-sensor">
    <div className="sensor-top"><span>{label}</span><strong>Temperature {reading.heightM?.toFixed(2)} m / {reading.heightFt.toFixed(2)} ft; wind {reading.windHeightM?.toFixed(2)} m / {reading.windHeightFt?.toFixed(2)} ft <small>AGL</small></strong></div>
    <div className="sensor-values">
      <div><b>{reading.temperatureC ?? '—'}<small> °C</small></b><span>Temperature</span></div>
      <div><b>{reading.speedMph ?? '—'}<small> mph</small></b><span>Wind speed</span></div>
      <div><b>{reading.directionDeg ?? '—'}<small>°</small></b><span>Wind from · true N</span></div>
    </div>
    <small>Source wind: {source.windSpeedMps} m/s. Quality flags (temperature / speed / direction): {source.temperatureQf} / {source.windSpeedQf} / {source.windDirectionQf} (0 = passed)</small>
  </article>;
}

export function HistoricalReplayPage({ config, timeDisplay, onTimeDisplayChange, onSave }: Props) {
  const [index, setIndex] = useState(Math.max(0, catalog.records.findIndex(record => record.start === '2024-06-01T02:00:00Z')));
  const [dateTime, setDateTime] = useState(() => formatLocationDateTimeInput(catalog.records[index].start, catalog.site.timezone));
  const [selectionError, setSelectionError] = useState('');
  const record = catalog.records[index];
  const evaluation = assessReplay(catalog, record.start, new Date().toISOString(), config, timeDisplay);
  const { result } = evaluation;

  function selectIndex(next: number) {
    const safeIndex = Math.max(0, Math.min(catalog.records.length - 1, next));
    setIndex(safeIndex);
    setDateTime(formatLocationDateTimeInput(catalog.records[safeIndex].start, catalog.site.timezone));
    setSelectionError('');
  }

  function selectDateTime(value: string) {
    setDateTime(value);
    const utc = locationDateTimeToUtc(value, catalog.site.timezone);
    if (!utc) {
      setSelectionError('Enter a valid location-local date and time. Times skipped by a daylight-saving change cannot be selected.');
      return;
    }
    const next = nearestReplayIndex(catalog, utc);
    if (next < 0 || Date.parse(utc) < Date.parse(catalog.records[0].start) || Date.parse(utc) > Date.parse(catalog.records[catalog.records.length - 1].start)) {
      setSelectionError('Choose a time within the available June 2024 observations.');
      return;
    }
    selectIndex(next);
  }

  return <section className="historical-page">
    <section className="panel replay-panel">
      <div className="section-heading">
        <div><span className="eyebrow">LOCAL VIRTUAL DATABASE · REAL OBSERVATIONS</span><h1>Arizona historical replay</h1><p>{catalog.site.name} (NEON SRER) · {catalog.site.ecosystem} · not an orchard validation</p></div>
        <label className="timezone-toggle">Display time<select value={timeDisplay} onChange={event => onTimeDisplayChange(event.target.value as ReplayTimezone)}><option value="local">Location local time ({catalog.site.timezone})</option><option value="utc">UTC</option></select></label>
      </div>
      <p className="historical-source-note">Only SRER is currently bundled. These are real NEON 30-minute averages from June 2024, not live sensor readings.</p>
      <div className="historical-controls">
        <label>Choose location
          <select value={catalog.site.id} disabled aria-label="Historical site"><option value={catalog.site.id}>{catalog.site.name} (SRER), Arizona</option></select>
        </label>
        <label>Choose date and time ({timeDisplay === 'utc' ? 'location time' : catalog.site.timezone})
          <input type="datetime-local" min={formatLocationDateTimeInput(catalog.records[0].start, catalog.site.timezone)} max={formatLocationDateTimeInput(catalog.records[catalog.records.length - 1].start, catalog.site.timezone)} value={dateTime} onChange={event => selectDateTime(event.target.value)}/>
        </label>
      </div>
      <small className="selection-help">The archive uses 30-minute intervals. A time between recorded intervals selects the closest available observation.</small>
      {selectionError && <p className="form-error" role="alert">{selectionError}</p>}
      <label className="replay-slider">Historical interval
        <input aria-label="Historical interval" type="range" min="0" max={catalog.records.length - 1} value={index} onChange={event => selectIndex(Number(event.target.value))}/>
        <span>{formatObservationTime(record, catalog.site.timezone, timeDisplay)}</span>
      </label>
      <div className="replay-meta"><span>Source interval (UTC): {record.start} – {record.end}</span><span>Evaluation time: {formatReplayTimestamp(evaluation.evaluatedAt, catalog.site.timezone, timeDisplay)}</span></div>
      <div className="scenario-buttons replay-actions">
        <button onClick={() => selectIndex(index - 1)} disabled={index === 0}>Previous interval</button>
        <button onClick={() => selectIndex(index + 1)} disabled={index === catalog.records.length - 1}>Next interval</button>
        <button className="primary" onClick={() => onSave(record.start, timeDisplay)}>Assess & save log</button>
      </div>
    </section>

    <section className={`panel status-panel ${result.status.toLowerCase()} historical-status`} aria-live="polite">
      <div className="section-heading"><span className="eyebrow">HISTORICAL TWO-HEIGHT ASSESSMENT</span><span className="snapshot">{result.status}</span></div>
      <h2>{result.status}</h2>
      <div className="reasons">{result.errors.map((error, item) => <p key={`error-${item}`}>{error}</p>)}{result.alerts.map(alert => <div className="reason" key={alert.code}><span className="reason-dot"/><div><strong>{alert.code.replaceAll('_', ' ')}</strong><p>{alert.reason}</p></div></div>)}{result.status === 'GO' && <p>No configured weather flags were triggered. This is not permission to spray.</p>}</div>
      <div className="historical-readings"><SensorReading label="LOWEST AVAILABLE LEVEL" reading={evaluation.pair.lower} source={evaluation.sourceReadings.lower}/><SensorReading label="HIGHEST AVAILABLE LEVEL" reading={evaluation.pair.upper} source={evaluation.sourceReadings.upper}/></div>
      <details className="historical-levels"><summary>All matched sensor levels ({evaluation.sourceReadings.levels.length})</summary><div className="table-scroll"><table><thead><tr><th>Level</th><th>Temperature sensor</th><th>Wind sensor</th><th>Temperature height</th><th>Wind height</th><th>Temperature</th><th>Wind</th><th>Direction</th><th>Quality flags (T / speed / direction)</th></tr></thead><tbody>{evaluation.sourceReadings.levels.map(level => <tr key={level.id}><td>{level.id}</td><td>{level.temperatureSensorLocationId}: {level.temperatureSensorDescription}</td><td>{level.windSensorLocationId}: {level.windSensorDescription}</td><td>{level.heightM} m</td><td>{level.windHeightM} m</td><td>{level.temperatureC} C</td><td>{level.windSpeedMps} m/s</td><td>{level.windDirectionDeg} deg</td><td>{level.temperatureQf} / {level.windSpeedQf} / {level.windDirectionQf}</td></tr>)}</tbody></table></div></details>
      <small>Comparison uses the lowest and highest available sensor levels. All timestamps preserve their source UTC interval; display times follow the selected preference. Follow pesticide labels and on-site conditions.</small>
      <small>Source: {evaluation.attribution} License: {evaluation.license}</small>
    </section>
  </section>;
}
