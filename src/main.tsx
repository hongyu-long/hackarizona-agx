import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defaults, evaluateRisk, finite, validConfig, type Config, type Pair, type Reading } from './features/weather/risk';
import { readLog, writeLog, storageKey, type Evaluation } from './features/weather/storage';
import scenarios from './data/scenarios.json';
import './styles/style.css';
import { OrchardSetup, useOrchardSetup } from './features/orchard/Onboarding';
import { exportSetup } from './features/orchard/orchard';
import './styles/onboarding.css';

const descriptions = { GO: 'No configured weather flags', CAUTION: 'Review changing conditions', STOP: 'Weather risk detected', UNAVAILABLE: 'Not enough reliable data' };
const nextChecks = { GO: 'Check the pesticide label and on-site conditions before deciding.', CAUTION: 'Review the flagged differences and reassess conditions before deciding.', STOP: 'Wait and reassess the flagged conditions. Follow the pesticide label.', UNAVAILABLE: 'Restore complete, current readings from both heights, then reassess.' };
function generate(scenarioId: string, config: Config): Evaluation {
  const s = scenarios.find(s => s.id === scenarioId)!;
  const now = new Date().toISOString();
  const reading = (index: number): Reading => ({ id: index ? 'upper' : 'lower', site: 'demo-orchard', heightFt: index ? 30 : 5, temperatureC: s.temperature[index], speedMph: s.speed[index], directionDeg: s.direction[index], observedAt: now });
  const pair: Pair = { lower: reading(0), upper: reading(1) };
  return { id: crypto.randomUUID(), scenario: s.name, evaluatedAt: now, source: 'simulated', mode: 'snapshot', pair, config: { ...config }, result: evaluateRisk(pair, config, Date.parse(now)) };
}
function download(records: Evaluation[]) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'spraywise-observations.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function time(iso: string) { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function Sensor({ r, label }: { r: Reading; label: string }) {
  return <div className="sensor"><div className="sensor-top"><span>{label}</span><strong>{r.heightFt} <small>ft AGL</small></strong></div><div className="sensor-values"><div><b>{r.temperatureC ?? '—'}<small> °C</small></b><span>Temperature</span></div><div><b>{r.speedMph ?? '—'}<small> mph</small></b><span>Wind speed</span></div><div><b className="direction">{finite(r.directionDeg) && <i style={{ transform: `rotate(${r.directionDeg + 180}deg)` }}>↑</i>}{r.directionDeg ?? '—'}<small>°</small></b><span>Wind from · true N</span></div></div></div>;
}
function App() {
  const orchardSetup = useOrchardSetup();
  const [notificationError, setNotificationError] = useState('');
  const [loaded] = useState(() => { try { return { records: readLog(localStorage), error: '' }; } catch { return { records: [] as Evaluation[], error: 'Existing records could not be read. They have not been overwritten. Export this session or explicitly clear local storage to start again.' }; } });
  const [records, setRecords] = useState(loaded.records);
  const [blocked, setBlocked] = useState(!!loaded.error);
  const [saveError, setSaveError] = useState(loaded.error);
  const [savedIds, setSavedIds] = useState(new Set(loaded.records.map(r => r.id)));
  const [scenario, setScenario] = useState('inversion');
  const [config, setConfig] = useState<Config>({ ...defaults });
  const [draft, setDraft] = useState({ speedCaution: '4', speedStop: '7', directionCaution: '45', directionStop: '90' });
  const [configError, setConfigError] = useState('');
  const [current, setCurrent] = useState<Evaluation>(() => generate('inversion', defaults));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  function persist(next: Evaluation[]) {
    setRecords(next);
    if (blocked) return;
    try { writeLog(localStorage, next); setSavedIds(new Set(next.map(r => r.id))); setSaveError(''); }
    catch (e) { setSaveError(e instanceof Error ? e.message : 'Storage is unavailable.'); }
  }
  function run(id = scenario, rules = config) {
    const entry = generate(id, rules); setScenario(id); setCurrent(entry); persist([entry, ...records]);
    if (orchardSetup.setup.notifications && current.result.status !== entry.result.status && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification(`SprayWise demo: ${entry.result.status}`, { body: `${entry.scenario}. ${descriptions[entry.result.status]}. Simulated data only.`, tag: 'spraywise-demo-status' }); setNotificationError(''); }
      catch { setNotificationError('System notification could not be shown. The assessment and in-page alerts remain available.'); }
    }
  }
  function applyRules(e: React.FormEvent) {
    e.preventDefault();
    const values = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim() === '' ? NaN : Number(v)]));
    const next = { ...config, ...values, version: `demo-${crypto.randomUUID().slice(0, 8)}` };
    if (!validConfig(next)) { setConfigError('Use non-negative values. Each Stop threshold must exceed Caution; direction cannot exceed 180°.'); return; }
    setConfigError(''); setConfig(next); run(scenario, next);
  }
  function clearLog() {
    if (!window.confirm('Clear all locally saved and unsaved records? Export first if you need to keep them.')) return;
    try { localStorage.removeItem(storageKey); setRecords([]); setSavedIds(new Set()); setSaveError(''); setBlocked(false); setSelectedId(null); }
    catch { setSaveError('Unable to clear local storage. Records remain available in this session.'); }
  }
  const { result, pair } = current;
  const lowerFlag = !finite(pair.lower.speedMph) ? 'Lower wind unavailable' : pair.lower.speedMph < config.minWind || pair.lower.speedMph > config.maxWind ? 'Lower-height wind flag' : 'No lower-height wind flag';
  const selected = records.find(r => r.id === selectedId);
  return <><header><a className="brand" href="#"><span className="brand-icon">↟</span> SprayWise<span className="brand-sub">ORCHARD INTELLIGENCE</span></a><span className="demo-badge"><span/>SIMULATED DATA</span></header>
  <div className="setup-container">{orchardSetup.editing ? <OrchardSetup controller={orchardSetup}/> : <section className="panel orchard-summary"><div><span className="eyebrow">YOUR ORCHARD · LOCAL ONLY</span><h2>{orchardSetup.setup.orchard?.name ?? 'Orchard not configured'}</h2><p>{orchardSetup.setup.orchard ? `${orchardSetup.setup.orchard.location.lat.toFixed(5)}, ${orchardSetup.setup.orchard.location.lng.toFixed(5)} · ${orchardSetup.setup.orchard.crop || 'Crop not set'}` : 'You can set up a location and preferences whenever you are ready.'}</p><small>No real weather tower is connected. The demonstration below uses simulated readings.</small></div><div className="setup-actions"><button onClick={() => orchardSetup.setEditing(true)}>Edit orchard & permissions</button><button onClick={() => exportSetup(orchardSetup.setup)}>Export settings</button><button onClick={orchardSetup.clear}>Clear settings</button></div></section>}{notificationError && <p role="status">{notificationError}</p>}{!orchardSetup.editing && orchardSetup.error && <p role="alert">{orchardSetup.error}</p>}</div>
  <main><div className="intro"><div><div className="eyebrow">FIELD CONDITIONS / DEMONSTRATION</div><h1>A clearer view.<br/><em>A better spray decision.</em></h1><p>What happens above the trees matters. Compare two heights<br className="desktop"/> to see what a ground-level station can miss.</p></div><div className="site-label"><span className="site-icon">⌖</span><div><strong>Demo orchard</strong><span>Single observation point · flat terrain</span><span>5 ft + 30 ft above ground</span></div></div></div>
  <section className="scenario-bar" aria-label="Demo scenarios"><div className="scenario-label"><span className="eyebrow">EXPLORE A SCENARIO</span><small>Select to analyze & log</small></div><div className="scenario-buttons">{scenarios.map((s, i) => <button key={s.id} className={scenario === s.id ? 'active' : ''} aria-pressed={scenario === s.id} onClick={() => run(s.id)}><span>0{i + 1}</span>{s.name}</button>)}</div></section>
  <div className="dashboard"><section className={`status-panel ${result.status.toLowerCase()}`} aria-live="polite"><div className="section-heading"><span className="eyebrow">TWO-HEIGHT ASSESSMENT</span><span className="snapshot">SIMULATED SNAPSHOT</span></div><div className="status-title"><span className="status-icon">{result.status === 'GO' ? '✓' : result.status === 'UNAVAILABLE' ? '?' : '!'}</span><div><h2>{result.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : result.status}</h2><p>{descriptions[result.status]}</p></div></div><div className="reasons">{result.errors.map((error, i) => <p key={i}>{error}</p>)}{result.alerts.map(alert => <div className="reason" key={alert.code}><span className="reason-dot"/><div><strong>{alert.code.replaceAll('_', ' ')}</strong><p>{alert.reason}</p></div></div>)}{result.status === 'GO' && <p>Neither height triggers the configured temperature or wind rules. This is not permission to spray.</p>}</div><div className="next-check"><span>NEXT CHECK</span><p>{nextChecks[result.status]}</p></div><div className="assessment-footer"><span>{time(current.evaluatedAt)}</span><button onClick={() => run()}>Reassess & log ↻</button></div><small className="snapshot-note">A fixed demo snapshot, not a live sensor feed. Reassess to generate new simulated readings.</small></section>
  <section className="profile panel"><div className="section-heading"><h2>The vertical picture</h2><span className="eyebrow">02 HEIGHTS</span></div><Sensor r={pair.upper} label="ABOVE THE CANOPY"/><div className="canopy"><span/><svg viewBox="0 0 400 48" aria-hidden="true"><path d="M0 43 Q8 8 30 25 Q40 -2 58 18 Q82 0 90 27 Q112 5 130 20 Q148 -2 160 26 Q180 1 200 22 Q220 -3 240 24 Q260 5 279 21 Q299 -1 315 23 Q334 5 350 24 Q376 0 400 43Z"/><path className="trunks" d="M45 30v18m60-15v15m70-18v18m60-15v15m65-18v18m60-15v15"/></svg><small>Illustrative canopy · not a measured wind field</small></div><Sensor r={pair.lower} label="NEAR THE GROUND"/><p className="wind-note">Arrows show downwind direction. Numbers show where wind comes from.</p></section></div>
  <section className="metrics" aria-label="Derived differences">{[['Temperature difference', result.deltaTemperature, '°C', 'Upper minus lower'], ['Wind speed difference', result.deltaSpeed, 'mph', 'Absolute difference'], ['Wind direction difference', result.deltaDirection, '°', 'Shortest angle between directions']].map(([label, value, unit, hint]) => <div className="metric" key={String(label)}><span>{label}</span><strong>{typeof value === 'number' ? `${label === 'Temperature difference' && value > 0 ? '+' : ''}${Number(value.toFixed(1))}` : '—'}<small>{unit}</small></strong><p>{hint}</p></div>)}</section>
  <section className="comparison panel"><div><span className="eyebrow">WHY TWO HEIGHTS?</span><h2>One station. Part of the story.</h2><p>Both checks use the same lower-height reading.</p></div><div className="comparison-result"><span>GROUND-ONLY CHECK</span><strong>{lowerFlag}</strong><small>Checks lower wind speed only. Cannot assess inversion or vertical differences.</small></div><div className="comparison-result"><span>SPRAYWISE · TWO HEIGHTS</span><strong className={`text-${result.status.toLowerCase()}`}>{result.status} · {result.alerts.length ? `${result.alerts.length} triggered rule${result.alerts.length === 1 ? '' : 's'}` : descriptions[result.status]}</strong><small>Checks both heights, their differences, and data quality.</small></div></section>
  <section className="panel log"><div className="section-heading"><div><span className="eyebrow">TRACEABLE BY DESIGN</span><h2>Observation log <span className="count">{records.length}</span></h2></div><div className="log-actions"><button disabled={!records.length} onClick={() => download(records)}>Export JSON ↓</button><button disabled={!records.length && !blocked} onClick={clearLog}>Clear log</button></div></div>{saveError && <div className="storage-error" role="alert"><strong>Not saved to this browser.</strong> {saveError} New results remain in memory; export before leaving. {!blocked && <button onClick={() => persist(records)}>Retry save</button>}</div>}
  {!records.length ? <div className="empty-log"><span>◎</span><p>Your evidence starts here.</p><small>Select a scenario or choose “Reassess & log” to save a timestamped assessment.</small></div> : <div className="table-scroll"><table><thead><tr><th>Evaluated · local time</th><th>Scenario</th><th>Status</th><th>Trigger / data issue</th><th>Record</th></tr></thead><tbody>{records.map(r => <tr key={r.id}><td>{time(r.evaluatedAt)}</td><td>{r.scenario}</td><td><span className={`pill ${r.result.status.toLowerCase()}`}>{r.result.status}</span></td><td>{r.result.errors.length ? r.result.errors.join(' ') : r.result.alerts.length ? r.result.alerts.map(a => a.code.replaceAll('_', ' ')).join(' · ') : 'No configured flags'}</td><td><button aria-expanded={selectedId === r.id} onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}>View evidence</button><small>{savedIds.has(r.id) ? 'Saved locally' : 'Not saved'}</small></td></tr>)}</tbody></table></div>}
  {selected && <div className="evidence"><div className="section-heading"><h3>Recorded evidence · {selected.scenario}</h3><button onClick={() => setSelectedId(null)}>Close</button></div><p>Historical snapshot. Original inputs, observation timestamps, evaluation time, rules and all triggers are preserved.</p><pre>{JSON.stringify(selected, null, 2)}</pre></div>}<p className="log-note">Stored only in this browser · UTC timestamps in exported records · 1,000 saved-record limit, no automatic deletion</p></section>
  <details className="panel rules"><summary>Analysis rules & demo thresholds <span>View / configure +</span></summary><p>Inversion: upper temperature exceeds lower temperature. Wind reference range: 3–10 mph, inclusive. Either violation triggers Stop. Actual wind limits depend on the pesticide label.</p><p>Shear thresholds below are configurable demonstration choices, not universal safety standards. The highest triggered severity wins; incomplete or stale input returns Unavailable.</p><form onSubmit={applyRules}><div className="rule-fields">{([['speedCaution','Speed difference · Caution (mph)'],['speedStop','Speed difference · Stop (mph)'],['directionCaution','Direction difference · Caution (°)'],['directionStop','Direction difference · Stop (°)']] as const).map(([key,label]) => <label key={key}>{label}<input type="number" min="0" step="any" required value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}/></label>)}</div>{configError && <p role="alert" className="form-error">{configError}</p>}<button className="primary" type="submit">Apply & reassess</button></form><small>Maximum reading age: 120 s · Maximum inter-sensor time difference: 60 s · Current rule version: {config.version}</small></details>
  <footer><span className="brand footer-brand">↟ SprayWise</span><p>Decision support, not authorization to spray. Follow pesticide labels, on-site checks and applicable regulations. No system guarantees zero drift. All readings in this demo are simulated.</p><span>MVP / 01</span></footer></main></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
