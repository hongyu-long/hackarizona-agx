import { useEffect, useState, type FormEvent } from 'react';
import { defaults, evaluateRisk, validConfig, type Config, type Pair, type Reading } from './features/weather/risk';
import { readLog, writeLog, storageKey, type Evaluation } from './features/weather/storage';
import { useOrchardSetup } from './features/orchard/Onboarding';
import scenarios from './data/scenarios.json';
import { ForecastPanel } from './features/forecast/ForecastPanel';
import { DashboardPage } from './pages/DashboardPage';
import { ObservationsPage } from './pages/ObservationsPage';
import { OrchardPage } from './pages/OrchardPage';
import { RulesPage, type RuleDraft } from './pages/RulesPage';
import './styles/style.css';
import './styles/branding.css';
import './styles/onboarding.css';
import './styles/pages.css';

type Page = 'dashboard' | 'orchard' | 'observations' | 'rules' | 'forecast';
const pages: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orchard', label: 'Orchard' },
  { id: 'observations', label: 'Observations' },
  { id: 'rules', label: 'Rules' },
  { id: 'forecast', label: 'Forecast experiment' }
];

function pageFromHash(): Page | null {
  const value = window.location.hash.replace(/^#\/?/, '');
  return pages.some(page => page.id === value) ? value as Page : null;
}

function generate(scenarioId: string, config: Config): Evaluation {
  const selected = scenarios.find(item => item.id === scenarioId)!;
  const now = new Date().toISOString();
  const reading = (index: number): Reading => ({ id: index ? 'upper' : 'lower', site: 'demo-orchard', heightFt: index ? 30 : 5, temperatureC: selected.temperature[index], speedMph: selected.speed[index], directionDeg: selected.direction[index], observedAt: now });
  const pair: Pair = { lower: reading(0), upper: reading(1) };
  return { id: crypto.randomUUID(), scenario: selected.name, evaluatedAt: now, source: 'simulated', mode: 'snapshot', pair, config: { ...config }, result: evaluateRisk(pair, config, Date.parse(now)) };
}

function download(records: Evaluation[]) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'to-spray-or-not-to-spray-observations.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AppNavigation({ page }: { page: Page }) {
  return <nav className="app-navigation" aria-label="Main navigation">{pages.map(item => <a key={item.id} href={`#/${item.id}`} aria-current={page === item.id ? 'page' : undefined}>{item.label}</a>)}</nav>;
}

export function App() {
  const orchardSetup = useOrchardSetup();
  const [page, setPage] = useState<Page>(() => pageFromHash() ?? 'dashboard');
  const [notificationError, setNotificationError] = useState('');
  const [loaded] = useState(() => {
    try { return { records: readLog(localStorage), error: '' }; }
    catch { return { records: [] as Evaluation[], error: 'Existing records could not be read. They have not been overwritten. Export this session or explicitly clear local storage to start again.' }; }
  });
  const [records, setRecords] = useState(loaded.records);
  const [blocked, setBlocked] = useState(!!loaded.error);
  const [saveError, setSaveError] = useState(loaded.error);
  const [savedIds, setSavedIds] = useState(new Set(loaded.records.map(record => record.id)));
  const [scenario, setScenario] = useState('inversion');
  const [config, setConfig] = useState<Config>({ ...defaults });
  const [draft, setDraft] = useState<RuleDraft>({ speedCaution: '4', speedStop: '7', directionCaution: '45', directionStop: '90' });
  const [configError, setConfigError] = useState('');
  const [current, setCurrent] = useState<Evaluation>(() => generate('inversion', defaults));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const updatePage = () => setPage(pageFromHash() ?? 'dashboard');
    window.addEventListener('hashchange', updatePage);
    return () => window.removeEventListener('hashchange', updatePage);
  }, []);

  function navigate(next: Page) {
    setPage(next);
    if (window.location.hash !== `#/${next}`) window.location.hash = `/${next}`;
  }

  function persist(next: Evaluation[]) {
    setRecords(next);
    if (blocked) return;
    try { writeLog(localStorage, next); setSavedIds(new Set(next.map(record => record.id))); setSaveError(''); }
    catch (error) { setSaveError(error instanceof Error ? error.message : 'Storage is unavailable.'); }
  }

  function run(id = scenario, rules = config) {
    const entry = generate(id, rules);
    setScenario(id);
    setCurrent(entry);
    persist([entry, ...records]);
    if (orchardSetup.setup.notifications && current.result.status !== entry.result.status && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification(`To Spray or Not to Spray demo: ${entry.result.status}`, { body: `${entry.scenario}. Simulated data only.`, tag: 'to-spray-or-not-to-spray-demo-status' }); setNotificationError(''); }
      catch { setNotificationError('System notification could not be shown. The assessment and in-page alerts remain available.'); }
    }
  }

  function applyRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim() === '' ? NaN : Number(value)])) as Pick<Config, keyof RuleDraft>;
    const next: Config = { ...config, ...values, version: `demo-${crypto.randomUUID().slice(0, 8)}` };
    if (!validConfig(next)) { setConfigError('Use non-negative values. Each Stop threshold must exceed Caution; direction cannot exceed 180°.'); return; }
    setConfigError('');
    setConfig(next);
    run(scenario, next);
  }

  function clearLog() {
    if (!window.confirm('Clear all locally saved and unsaved records? Export first if you need to keep them.')) return;
    try { localStorage.removeItem(storageKey); setRecords([]); setSavedIds(new Set()); setSaveError(''); setBlocked(false); setSelectedId(null); }
    catch { setSaveError('Unable to clear local storage. Records remain available in this session.'); }
  }

  const initialSetup = !orchardSetup.setup.completed && orchardSetup.editing;
  const currentPage = initialSetup ? 'orchard' : page;
  return <>
    <header className="app-header"><a className="brand" href="#/dashboard"><span className="brand-icon">↟</span><span className="brand-copy"><span className="brand-name">To Spray or Not to Spray</span><span className="brand-tagline">To Spray or Not To Spray? That is the Question.</span></span></a>{!initialSetup && <span className="demo-badge"><span/>SIMULATED DATA</span>}</header>
    {!initialSetup && <AppNavigation page={currentPage}/>}
    <main className="app-main">
      {notificationError && <p role="status" className="app-notice">{notificationError}</p>}
      {currentPage === 'dashboard' && <DashboardPage current={current} scenario={scenario} scenarios={scenarios} config={config} onScenario={id => run(id)} onReassess={() => run()}/>}
      {currentPage === 'forecast' && <ForecastPanel/>}
      {currentPage === 'orchard' && <OrchardPage controller={orchardSetup} onComplete={() => navigate('dashboard')}/>}
      {currentPage === 'observations' && <ObservationsPage records={records} savedIds={savedIds} saveError={saveError} blocked={blocked} selectedId={selectedId} onDownload={() => download(records)} onClear={clearLog} onRetry={() => persist(records)} onSelect={setSelectedId}/>}
      {currentPage === 'rules' && <RulesPage config={config} draft={draft} error={configError} onDraftChange={(key, value) => setDraft(previous => ({ ...previous, [key]: value }))} onSubmit={applyRules}/>}
    </main>
    {!initialSetup && <footer className="app-footer"><span className="footer-brand">↟ To Spray or Not to Spray</span><p>Decision support, not authorization to spray. Follow pesticide labels, on-site checks and applicable regulations. No system guarantees zero drift. All readings in this demo are simulated.</p><span>MVP / 01</span></footer>}
  </>;
}
