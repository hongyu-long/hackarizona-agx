import { useState } from 'react';
import { parseForecast, loadForecasts, saveForecast, type Forecast } from './artifact';

export function ForecastPanel() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState('Import a local experiment report to inspect historical forecasts.');
  const current = forecasts[selected];
  async function importReport(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Report exceeds 5 MB.');
      const value: unknown = JSON.parse(await file.text());
      if (!value || typeof value !== 'object' || !('schemaVersion' in value) || value.schemaVersion !== 1 || !('forecasts' in value) || !Array.isArray(value.forecasts) || value.forecasts.length > 672) throw new Error('Invalid forecast report.');
      const entries = value.forecasts.map(parseForecast);
      setForecasts(entries); setSelected(0); setMessage(entries.length ? 'Historical report loaded. Current weather screening is unchanged.' : 'No eligible forecast cases in this report.');
    } catch (e) { setForecasts([]); setMessage(e instanceof Error ? e.message : 'Import failed.'); }
  }
  function save() {
    if (!current) return;
    try { saveForecast(localStorage, current); setMessage('Forecast evidence saved locally.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Not saved.'); }
  }
  function exportEvidence() {
    try {
      const saved = loadForecasts(localStorage);
      const url = URL.createObjectURL(new Blob([JSON.stringify(saved.length ? saved : forecasts, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'inversion-forecast-evidence.json'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Export failed.'); }
  }
  return <section className="panel" aria-label="Historical inversion forecast">
    <h2>Inversion forecast experiment</h2>
    <p>Historical predictions for the next 30-minute average. Separate from current GO / CAUTION / STOP screening.</p>
    <label>Import experiment report <input type="file" accept="application/json,.json" onChange={event => void importReport(event.target.files?.[0])}/></label>
    <p role="status">{message}</p>
    {forecasts.length > 0 && <label>Site and prediction cutoff (UTC) <select value={selected} onChange={event => setSelected(Number(event.target.value))}>{forecasts.map((r, i) => <option key={`${r.site}/${r.cutoff}/${i}`} value={i}>{r.site} · {r.cutoff}</option>)}</select></label>}
    {current && <>
      <p>Target interval: {current.cutoff} – {current.targetEnd}</p>
      {current.state === 'unavailable' ? <p>Unavailable: {current.reason}</p> : <>
        <p><strong>{current.predictor === 'TabPFN' ? `Inversion probability: ${(current.probability * 100).toFixed(1)}%` : `Persistence baseline: ${current.prediction ? 'inversion' : 'no inversion'} predicted; probability not supplied.`}</strong></p>
        <p>Reliability: uncalibrated, small-sample experiment. Probability is not model accuracy.</p>
        <p>Input data: passed quality checks. Predictor: {current.predictor} ({current.modelVersion}); features: {current.variant}.</p>
      </>}
      <ul>{current.limitations.map((reason, i) => <li key={i}>{reason}</li>)}</ul>
      <p>Source: {current.source}. Generated: {current.generatedAt}</p>
      {current.provenance && <p>{current.provenance.ecosystem}. Temperature heights: {current.provenance.temperatureHeightsM.join(' / ')} m; wind heights: {current.provenance.windHeightsM.join(' / ')} m above ground. {current.provenance.attribution} ({current.provenance.license})</p>}
      <button onClick={save}>Save forecast evidence</button>
    </>}
    <button onClick={exportEvidence}>Export forecast evidence</button>
  </section>;
}
