import type { Evaluation } from '../features/weather/storage';
import { formatObservationTime, formatReplayTimestamp, type ReplayTimezone } from '../features/weather/historical';

type Props = {
  records: Evaluation[];
  savedIds: Set<string>;
  saveError: string;
  blocked: boolean;
  selectedId: string | null;
  timeDisplay: ReplayTimezone;
  onTimeDisplayChange: (value: ReplayTimezone) => void;
  onDownload: () => void;
  onClear: () => void;
  onRetry: () => void;
  onSelect: (id: string | null) => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ObservationsPage({ records, savedIds, saveError, blocked, selectedId, timeDisplay, onTimeDisplayChange, onDownload, onClear, onRetry, onSelect }: Props) {
  const selected = records.find(record => record.id === selectedId);
  const evaluatedTime = (record: Evaluation) => record.source === 'NEON' ? formatReplayTimestamp(record.evaluatedAt, record.site?.timezone ?? 'America/Phoenix', timeDisplay) : formatTime(record.evaluatedAt);
  const observedTime = (record: Evaluation) => record.source === 'NEON' ? formatObservationTime(record.observation, record.site?.timezone ?? 'America/Phoenix', timeDisplay) : formatTime(record.pair.lower.observedAt);
  return <section className="panel log observations-page"><div className="section-heading"><div><span className="eyebrow">TRACEABLE BY DESIGN</span><h1>Observation log <span className="count">{records.length}</span></h1></div><div className="log-actions"><label>Display time <select value={timeDisplay} onChange={event => onTimeDisplayChange(event.target.value as ReplayTimezone)}><option value="local">Location local time</option><option value="utc">UTC</option></select></label><button disabled={!records.length} onClick={onDownload}>Export JSON</button><button disabled={!records.length && !blocked} onClick={onClear}>Clear log</button></div></div>
    {saveError && <div className="storage-error" role="alert"><strong>Not saved to this browser.</strong> {saveError} New results remain in memory; export before leaving. {!blocked && <button onClick={onRetry}>Retry save</button>}</div>}
    {!records.length ? <div className="empty-log"><span>Evidence</span><p>Your evidence starts here.</p><small>Assess a historical interval or select a simulated scenario to save a timestamped assessment.</small></div> : <div className="table-scroll"><table><thead><tr><th>Evaluated time</th><th>Observation interval</th><th>Scenario / source</th><th>Status</th><th>Trigger / data issue</th><th>Record</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{evaluatedTime(record)}</td><td>{observedTime(record)}</td><td>{record.scenario}{record.source === 'NEON' && <small>{record.site?.name ?? 'NEON SRER'} - NEON</small>}</td><td><span className={`pill ${record.result.status.toLowerCase()}`}>{record.result.status}</span></td><td>{record.result.errors.length ? record.result.errors.join(' ') : record.result.alerts.length ? record.result.alerts.map(alert => alert.code.replaceAll('_', ' ')).join(', ') : 'No configured flags'}</td><td><button aria-expanded={selectedId === record.id} onClick={() => onSelect(selectedId === record.id ? null : record.id)}>View evidence</button><small>{savedIds.has(record.id) ? 'Saved locally' : 'Not saved'}</small></td></tr>)}</tbody></table></div>}
    {selected && <div className="evidence"><div className="section-heading"><h2>Recorded evidence - {selected.scenario}</h2><button onClick={() => onSelect(null)}>Close</button></div><p>Original inputs, observation timestamps, evaluation time, source, rule settings and triggers are preserved.</p><pre>{JSON.stringify(selected, null, 2)}</pre></div>}
    <p className="log-note">Stored only in this browser. Exported source timestamps remain UTC. 1,000 saved-record limit; no automatic deletion.</p>
  </section>;
}
