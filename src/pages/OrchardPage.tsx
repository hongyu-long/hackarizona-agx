import { OrchardOptions, OrchardSetup, type SetupController } from '../features/orchard/Onboarding';
import { exportSetup } from '../features/orchard/orchard';

type Props = { controller: SetupController; onComplete: () => void };

export function OrchardPage({ controller, onComplete }: Props) {
  const { setup, error, editing, setEditing, clear } = controller;
  if (!setup.completed && editing) return <OrchardOptions controller={controller} onComplete={onComplete}/>;
  if (editing) return <OrchardSetup controller={controller}/>;
  return <section className="panel orchard-summary orchard-page"><div><span className="eyebrow">YOUR ORCHARD · LOCAL ONLY</span><h1>{setup.orchard?.name ?? 'Orchard not configured'}</h1><p>{setup.orchard ? `${setup.orchard.location.lat.toFixed(5)}, ${setup.orchard.location.lng.toFixed(5)} · ${setup.orchard.crop || 'Crop not set'}` : 'You can set up a location and preferences whenever you are ready.'}</p><small>No real weather tower is connected. The demonstration uses simulated readings.</small>{error && <p role="alert">{error}</p>}</div><div className="setup-actions"><button onClick={() => setEditing(true)}>Edit orchard & permissions</button><button onClick={() => exportSetup(setup)}>Export settings</button><button onClick={clear}>Clear settings</button></div></section>;
}