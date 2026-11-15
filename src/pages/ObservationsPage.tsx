import type { Evaluation } from '../features/weather/storage';

type Props = {
  records: Evaluation[];
  savedIds: Set<string>;
  saveError: string;
  blocked: boolean;
  selectedId: string | null;
  onDownload: () => void;
  onClear: () => void;
  onRetry: () => void;
  onSelect: (id: string | null) => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function triggerSummary(record: Evaluation) {
  return record.result.errors.length ? record.result.errors.join(' ') : record.result.alerts.length ? record.result.alerts.map(alert => alert.code.replaceAll('_', ' ')).join(' · ') : 'No configured flags';
}

export function ObservationsPage({ records, savedIds, saveError, blocked, selectedId, onDownload, onClear, onRetry, onSelect }: Props) {
  const selected = records.find(record => record.id === selectedId);
  return <section className="panel log observations-page"><div className="section-heading"><div><span className="eyebrow">TRACEABLE BY DESIGN</span><h1>Observation log <span className="count">{records.length}</span></h1></div><div className="log-actions"><button disabled={!records.length} onClick={onDownload}>Export JSON ↓</button><button disabled={!records.length && !blocked} onClick={onClear}>Clear log</button></div></div>
    {saveError && <div className="storage-error" role="alert"><strong>Not saved to this browser.</strong> {saveError} New results remain in memory; export before leaving. {!blocked && <button onClick={onRetry}>Retry save</button>}</div>}
    {!records.length ? <div className="empty-log"><span>◎</span><p>Your evidence starts here.</p><small>Select a scenario or choose “Reassess & log” from the dashboard.</small></div> : <>
      <div className="table-scroll observations-table"><table><thead><tr><th>Evaluated · local time</th><th>Scenario</th><th>Status</th><th>Trigger / data issue</th><th>Record</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{formatTime(record.evaluatedAt)}</td><td>{record.scenario}</td><td><span className={`pill ${record.result.status.toLowerCase()}`}>{record.result.status}</span></td><td>{triggerSummary(record)}</td><td><button aria-expanded={selectedId === record.id} onClick={() => onSelect(selectedId === record.id ? null : record.id)}>{selectedId === record.id ? 'Hide evidence' : 'View evidence'}</button><small>{savedIds.has(record.id) ? 'Saved locally' : 'Not saved'}</small></td></tr>)}</tbody></table></div>
      <div className="observations-mobile-list" aria-label="Observation records">{records.map(record => <article className="observation-card" key={record.id}>
        <div className="observation-card-top"><span className={`pill ${record.result.status.toLowerCase()}`}>{record.result.status}</span><time dateTime={record.evaluatedAt}>{formatTime(record.evaluatedAt)}</time></div>
        <h2>{record.scenario}</h2>
        <p className="observation-trigger">{triggerSummary(record)}</p>
        <div className="observation-card-actions"><button aria-expanded={selectedId === record.id} onClick={() => onSelect(selectedId === record.id ? null : record.id)}>{selectedId === record.id ? 'Hide evidence' : 'View evidence'}</button><small>{savedIds.has(record.id) ? 'Saved locally' : 'Not saved'}</small></div>
      </article>)}</div>
    </>}
    {selected && <div className="evidence"><div className="section-heading"><h2>Recorded evidence · {selected.scenario}</h2><button onClick={() => onSelect(null)}>Close</button></div><p>Historical snapshot. Original inputs, observation timestamps, evaluation time, rules and all triggers are preserved.</p><pre>{JSON.stringify(selected, null, 2)}</pre></div>}
    <p className="log-note">Stored only in this browser · UTC timestamps in exported records · 1,000 saved-record limit, no automatic deletion</p>
  </section>;
}