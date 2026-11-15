import type { FormEvent } from 'react';
import type { Config } from '../features/weather/risk';

export type RuleDraft = { speedCaution: string; speedStop: string; directionCaution: string; directionStop: string };
type Props = {
  config: Config;
  draft: RuleDraft;
  error: string;
  onDraftChange: (key: keyof RuleDraft, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RulesPage({ config, draft, error, onDraftChange, onSubmit }: Props) {
  const fields: [keyof RuleDraft, string][] = [
    ['speedCaution', 'Speed difference · Caution (mph)'],
    ['speedStop', 'Speed difference · Stop (mph)'],
    ['directionCaution', 'Direction difference · Caution (°)'],
    ['directionStop', 'Direction difference · Stop (°)']
  ];
  return <section className="panel rules rules-page"><div className="section-heading"><div><span className="eyebrow">CONFIGURATION</span><h1>Analysis rules</h1></div><span className="eyebrow">DEMO THRESHOLDS</span></div>
    <p>Inversion: upper temperature exceeds lower temperature. Wind reference range: 3–10 mph, inclusive. Either violation triggers Stop. Actual wind limits depend on the pesticide label.</p>
    <p>Shear thresholds below are configurable demonstration choices, not universal safety standards. The highest triggered severity wins; incomplete or stale input returns Unavailable.</p>
    <form onSubmit={onSubmit}><div className="rule-fields">{fields.map(([key, label]) => <label key={key}>{label}<input type="number" min="0" step="any" required value={draft[key]} onChange={event => onDraftChange(key, event.target.value)}/></label>)}</div>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary" type="submit">Apply & reassess</button></form>
    <small>Maximum reading age: {config.maxAgeSeconds} s · Maximum inter-sensor time difference: {config.maxSkewSeconds} s · Current rule version: {config.version}</small>
  </section>;
}