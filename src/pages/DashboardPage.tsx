import type { Config, Reading } from '../features/weather/risk';
import type { Evaluation } from '../features/weather/storage';

type Scenario = { id: string; name: string };
type Props = {
  current: Evaluation;
  scenario: string;
  scenarios: Scenario[];
  config: Config;
  onScenario: (id: string) => void;
  onReassess: () => void;
  onHistoricalReplay: () => void;
};

const descriptions = { GO: 'No configured weather flags', CAUTION: 'Review changing conditions', STOP: 'Weather risk detected', UNAVAILABLE: 'Not enough reliable data' };
const nextChecks = { GO: 'Check the pesticide label and on-site conditions before deciding.', CAUTION: 'Review the flagged differences and reassess conditions before deciding.', STOP: 'Wait and reassess the flagged conditions. Follow the pesticide label.', UNAVAILABLE: 'Restore complete, current readings from both heights, then reassess.' };

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function Sensor({ reading, label }: { reading: Reading; label: string }) {
  return <div className="sensor"><div className="sensor-top"><span>{label}</span><strong>{reading.heightFt} <small>ft AGL</small></strong></div><div className="sensor-values"><div><b>{reading.temperatureC ?? '—'}<small> °C</small></b><span>Temperature</span></div><div><b>{reading.speedMph ?? '—'}<small> mph</small></b><span>Wind speed</span></div><div><b className="direction">{typeof reading.directionDeg === 'number' && <i style={{ transform: `rotate(${reading.directionDeg + 180}deg)` }}>↑</i>}{reading.directionDeg ?? '—'}<small>°</small></b><span>Wind from · true N</span></div></div></div>;
}

export function DashboardPage({ current, scenario, scenarios, config, onScenario, onReassess, onHistoricalReplay }: Props) {
  const { result, pair } = current;
  const lowerFlag = typeof pair.lower.speedMph !== 'number' ? 'Lower wind unavailable' : pair.lower.speedMph < config.minWind || pair.lower.speedMph > config.maxWind ? 'Lower-height wind flag' : 'No lower-height wind flag';
  return <>
    <div className="intro"><div><div className="eyebrow">FIELD CONDITIONS / DEMONSTRATION</div><h1>A clearer view.<br/><em>A better spray decision.</em></h1><p>What happens above the trees matters. Compare two heights<br className="desktop"/> to see what a ground-level station can miss.</p></div><div className="site-label"><span className="site-icon">⌖</span><div><strong>Demo orchard</strong><span>Single observation point · flat terrain</span><span>5 ft + 30 ft above ground</span></div></div></div>
    <section className="scenario-bar" aria-label="Demo scenarios"><div className="scenario-label"><span className="eyebrow">EXPLORE A SCENARIO</span><small>Select to analyze & log</small></div><div className="scenario-buttons">{scenarios.map((item, index) => <button key={item.id} className={scenario === item.id ? 'active' : ''} aria-pressed={scenario === item.id} onClick={() => onScenario(item.id)}><span>0{index + 1}</span>{item.name}</button>)}</div></section>
    <section className="scenario-bar historical-entry"><div className="scenario-label"><span className="eyebrow">REAL HISTORICAL DATA</span><small>Arizona NEON archive</small></div><button className="primary" onClick={onHistoricalReplay}>Open Arizona historical data</button></section>
    <div className="dashboard"><section className={`status-panel ${result.status.toLowerCase()}`} aria-live="polite"><div className="section-heading"><span className="eyebrow">TWO-HEIGHT ASSESSMENT</span><span className="snapshot">SIMULATED SNAPSHOT</span></div><div className="status-title"><span className="status-icon">{result.status === 'GO' ? '✓' : result.status === 'UNAVAILABLE' ? '?' : '!'}</span><div><h2>{result.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : result.status}</h2><p>{descriptions[result.status]}</p></div></div><div className="reasons">{result.errors.map((error, index) => <p key={index}>{error}</p>)}{result.alerts.map(alert => <div className="reason" key={alert.code}><span className="reason-dot"/><div><strong>{alert.code.replaceAll('_', ' ')}</strong><p>{alert.reason}</p></div></div>)}{result.status === 'GO' && <p>Neither height triggers the configured temperature or wind rules. This is not permission to spray.</p>}</div><div className="next-check"><span>NEXT CHECK</span><p>{nextChecks[result.status]}</p></div><div className="assessment-footer"><span>{formatTime(current.evaluatedAt)}</span><button onClick={onReassess}>Reassess & log ↻</button></div><small className="snapshot-note">A fixed demo snapshot, not a live sensor feed. Reassess to generate new simulated readings.</small></section>
      <section className="profile panel"><div className="section-heading"><h2>The vertical picture</h2><span className="eyebrow">02 HEIGHTS</span></div><Sensor reading={pair.upper} label="ABOVE THE CANOPY"/><div className="canopy"><span/><svg viewBox="0 0 400 48" aria-hidden="true"><path d="M0 43 Q8 8 30 25 Q40 -2 58 18 Q82 0 90 27 Q112 5 130 20 Q148 -2 160 26 Q180 1 200 22 Q220 -3 240 24 Q260 5 279 21 Q299 -1 315 23 Q334 5 350 24 Q376 0 400 43Z"/><path className="trunks" d="M45 30v18m60-15v15m70-18v18m60-15v15m65-18v18m60-15v15"/></svg><small>Illustrative canopy · not a measured wind field</small></div><Sensor reading={pair.lower} label="NEAR THE GROUND"/><p className="wind-note">Arrows show downwind direction. Numbers show where wind comes from.</p></section>
    </div>
    <section className="metrics" aria-label="Derived differences">{[['Temperature difference', result.deltaTemperature, '°C', 'Upper minus lower'], ['Wind speed difference', result.deltaSpeed, 'mph', 'Absolute difference'], ['Wind direction difference', result.deltaDirection, '°', 'Shortest angle between directions']].map(([label, value, unit, hint]) => <div className="metric" key={String(label)}><span>{label}</span><strong>{typeof value === 'number' ? `${label === 'Temperature difference' && value > 0 ? '+' : ''}${Number(value.toFixed(1))}` : '—'}<small>{unit}</small></strong><p>{hint}</p></div>)}</section>
    <section className="comparison panel"><div><span className="eyebrow">WHY TWO HEIGHTS?</span><h2>One station. Part of the story.</h2><p>Both checks use the same lower-height reading.</p></div><div className="comparison-result"><span>GROUND-ONLY CHECK</span><strong>{lowerFlag}</strong><small>Checks lower wind speed only. Cannot assess inversion or vertical differences.</small></div><div className="comparison-result"><span>TWO-HEIGHT ASSESSMENT</span><strong className={`text-${result.status.toLowerCase()}`}>{result.status} · {result.alerts.length ? `${result.alerts.length} triggered rule${result.alerts.length === 1 ? '' : 's'}` : descriptions[result.status]}</strong><small>Checks both heights, their differences, and data quality.</small></div></section>
  </>;
}
