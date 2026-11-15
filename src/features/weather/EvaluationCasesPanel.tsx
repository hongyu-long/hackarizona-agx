import { useEffect, useMemo, useState } from 'react';
import { evaluateRisk, type Pair, type Result } from './risk';
import { loadEvaluationDatasets, type EvaluationCase, type EvaluationDataset } from './evaluationCases';
import type { Config } from './risk';

type Props = { config: Config };
type AssessedCase = { record: EvaluationCase; result: Result };

function assess(record: EvaluationCase, datasetId: EvaluationDataset['id'], config: Config): Result {
  const site = `case-${datasetId}`;
  const pair: Pair = {
    lower: { id: `${site}-5ft`, site, heightFt: 5, temperatureC: record.lowerTemperatureC, speedMph: record.lowerWindMph, directionDeg: record.lowerDirectionDeg, observedAt: record.observedAt },
    upper: { id: `${site}-30ft`, site, heightFt: 30, temperatureC: record.upperTemperatureC, speedMph: record.upperWindMph, directionDeg: record.upperDirectionDeg, observedAt: record.observedAt }
  };
  return evaluateRisk(pair, config, Date.parse(record.observedAt));
}

function SensorCase({ label, temperature, wind, direction, height }: { label: string; temperature: number; wind: number; direction: number; height: number }) {
  return <article className="sensor historical-sensor">
    <div className="sensor-top"><span>{label}</span><strong>{height} ft <small>AGL · CSV level</small></strong></div>
    <div className="sensor-values">
      <div><b>{temperature}<small> °C</small></b><span>Temperature</span></div>
      <div><b>{wind}<small> mph</small></b><span>Wind speed</span></div>
      <div><b>{direction}<small>°</small></b><span>Wind from · CSV value</span></div>
    </div>
  </article>;
}

export function EvaluationCasesPanel({ config }: Props) {
  const [datasets, setDatasets] = useState<EvaluationDataset[]>([]);
  const [datasetId, setDatasetId] = useState<EvaluationDataset['id']>('arizona');
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadEvaluationDatasets().then(value => {
      if (active) {
        setDatasets(value);
        setLoading(false);
      }
    }).catch(reason => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'Unable to load historical test cases.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const dataset = datasets.find(item => item.id === datasetId);
  const assessed = useMemo<AssessedCase[]>(() => dataset
    ? dataset.records.map(record => ({ record, result: assess(record, dataset.id, config) }))
    : [], [dataset, config]);
  const current = assessed[index];
  const counts = useMemo(() => assessed.reduce((summary, item) => {
    summary[item.result.status] += 1;
    if (item.record.upperTemperatureC > item.record.lowerTemperatureC) summary.inversions += 1;
    return summary;
  }, { GO: 0, CAUTION: 0, STOP: 0, UNAVAILABLE: 0, inversions: 0 }), [assessed]);

  function selectDataset(id: EvaluationDataset['id']) {
    setDatasetId(id);
    setIndex(0);
  }

  return <section className="historical-page data-evaluation" aria-label="Historical weather test cases">
    <section className="panel replay-panel">
      <div className="section-heading">
        <div><span className="eyebrow">DATAEVALUATION · SUPPLIED TEST CASES</span><h1>Historical weather replay</h1><p>Replay past multi-height cases through the current weather-rule screen.</p></div>
        <span className="snapshot">NOT LIVE</span>
      </div>
      <p className="historical-source-note">This is a rule-based review of each recorded interval, not a future inversion forecast or TabPFN output. The CSVs provide weather readings only; their source, timestamp timezone, sensor quality, cloud/fog, orchard geography, equipment and pesticide properties are not documented or modeled.</p>
      {loading && <p role="status">Loading supplied test cases…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {dataset && <>
        <div className="historical-controls">
          <label>Test dataset
            <select value={dataset.id} onChange={event => selectDataset(event.target.value as EvaluationDataset['id'])}>
              {datasets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="dataset-summary" aria-label="Dataset summary">
            <span>{assessed.length.toLocaleString()} cases</span>
            <span>{counts.inversions.toLocaleString()} inversion intervals</span>
            <span>{counts.STOP.toLocaleString()} STOP · {counts.CAUTION.toLocaleString()} CAUTION · {counts.GO.toLocaleString()} GO</span>
          </div>
        </div>
        <div className="case-navigation">
          <button onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0}>Previous case</button>
          <label>Case {index + 1} of {assessed.length.toLocaleString()}
            <input aria-label="Historical test case" type="range" min="0" max={Math.max(0, assessed.length - 1)} value={index} onChange={event => setIndex(Number(event.target.value))}/>
          </label>
          <button onClick={() => setIndex(value => Math.min(assessed.length - 1, value + 1))} disabled={index >= assessed.length - 1}>Next case</button>
        </div>
      </>}
    </section>
    {current && dataset && <>
      <section className={`panel status-panel historical-status ${current.result.status.toLowerCase()}`} aria-live="polite">
        <div className="section-heading"><span className="eyebrow">HISTORICAL CASE · {dataset.name}</span><span className="snapshot">{current.result.status}</span></div>
        <h2>{current.result.status}</h2>
        <p>Source timestamp: <strong>{current.record.timestamp}</strong> (timezone not supplied by CSV)</p>
        <div className="reasons">{current.result.errors.map((message, item) => <p key={`error-${item}`}>{message}</p>)}{current.result.alerts.map(alert => <div className="reason" key={alert.code}><span className="reason-dot"/><div><strong>{alert.code.replaceAll('_', ' ')}</strong><p>{alert.reason}</p></div></div>)}{current.result.status === 'GO' && <p>No configured weather flags were triggered for this test case. This is not permission to spray.</p>}</div>
        <div className="historical-readings">
          <SensorCase label="LOWER CSV LEVEL" height={5} temperature={current.record.lowerTemperatureC} wind={current.record.lowerWindMph} direction={current.record.lowerDirectionDeg}/>
          <SensorCase label="UPPER CSV LEVEL" height={30} temperature={current.record.upperTemperatureC} wind={current.record.upperWindMph} direction={current.record.upperDirectionDeg}/>
        </div>
        <div className="metrics case-metrics" aria-label="Case weather differences">
          <div className="metric"><span>Upper minus lower temperature</span><strong>{(current.record.upperTemperatureC - current.record.lowerTemperatureC).toFixed(2)}<small> °C</small></strong></div>
          <div className="metric"><span>Wind speed difference</span><strong>{Math.abs(current.record.upperWindMph - current.record.lowerWindMph).toFixed(2)}<small> mph</small></strong></div>
          <div className="metric"><span>Wind direction difference</span><strong>{current.result.deltaDirection?.toFixed(1) ?? '—'}<small>°</small></strong></div>
        </div>
        <small>Factors screened: temperature inversion, wind speed at both CSV levels, wind-speed shear and direction shear. Thresholds come from the app’s current demo rules. CSV readings have not been independently validated.</small>
      </section>
    </>}
  </section>;
}
