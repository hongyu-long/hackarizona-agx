import { useEffect, useRef, useState } from 'react';
import { OrchardMap } from './OrchardMap';
import { emptySetup, exportSetup, readSetup, setupKey, validOrchard, validPoint, writeSetup, type Orchard, type Point, type Setup } from './orchard';

export function useOrchardSetup() {
  const [initial] = useState(() => { try { return { value: readSetup(localStorage), error: '' }; } catch { return { value: { ...emptySetup }, error: 'Orchard settings could not be read. Existing data has not been overwritten. You can clear settings explicitly or continue without saving.' }; } });
  const [setup, setSetup] = useState(initial.value);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(!!initial.error);
  const [editing, setEditing] = useState(!initial.value.completed);
  function save(next: Setup) {
    if (blocked) { setError('Clear unreadable saved settings first, or export the draft and continue without saving.'); return false; }
    try { writeSetup(localStorage, next); setSetup(next); setError(''); return true; }
    catch { setError('Not saved. Browser storage is unavailable. Export the draft or continue without saving.'); return false; }
  }
  function clear() {
    if (!confirm('Clear orchard details and app notification preferences on this device? Observation logs and browser-granted permissions are unchanged.')) return;
    try { localStorage.removeItem(setupKey); setSetup({ ...emptySetup }); setError(''); setBlocked(false); setEditing(true); }
    catch { setError('Could not clear saved settings.'); }
  }
  return { setup, error, editing, setEditing, save, clear };
}
export type SetupController = ReturnType<typeof useOrchardSetup>;

export function OrchardOptions({ controller, onComplete }: { controller: SetupController; onComplete?: () => void }) {
  const { setup, error, save, clear, setEditing } = controller;
  const [name, setName] = useState(setup.orchard?.name ?? '');
  const [crop, setCrop] = useState(setup.orchard?.crop ?? '');
  const [height, setHeight] = useState(setup.orchard?.treeHeightFt?.toString() ?? '');
  const [lat, setLat] = useState(setup.orchard?.location.lat.toString() ?? '');
  const [lng, setLng] = useState(setup.orchard?.location.lng.toString() ?? '');
  const [boundary, setBoundary] = useState<Point[]>(setup.orchard?.boundary ?? []);
  const [mapVisible, setMapVisible] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const candidate = { lat: Number(lat), lng: Number(lng) };
  const location = lat.trim() && lng.trim() && validPoint(candidate) ? candidate : null;
  const orchard: Orchard | null = location ? {
    name: name.trim(),
    location,
    boundary,
    crop: crop.trim(),
    treeHeightFt: height.trim() ? Number(height) : null
  } : null;

  function loadLocation(showMap = true) {
    if (!navigator.geolocation || !window.isSecureContext) {
      setMessage('Location requires a secure connection. Enter the orchard coordinates manually.');
      return;
    }
    setLocating(true);
    setMessage('Waiting for browser location permission…');
    navigator.geolocation.getCurrentPosition(position => {
      setLocating(false);
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      setLat(point.lat.toFixed(6));
      setLng(point.lng.toFixed(6));
      setConfirmed(false);
      if (showMap) setMapVisible(true);
      setMessage(`Location loaded (reported accuracy about ${Math.round(position.coords.accuracy)} m). Confirm this point represents your orchard before saving.`);
    }, error => {
      setLocating(false);
      setMessage(error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. Allow it in your browser site settings or enter coordinates manually.'
        : 'Location is unavailable. Enter the orchard coordinates manually.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  useEffect(() => {
    if (!setup.orchard) loadLocation(true);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orchard || !validOrchard(orchard) || !confirmed) {
      setMessage('Enter a name and valid orchard coordinates, then confirm the location.');
      return;
    }
    if (save({ version: 1, completed: true, orchard, notifications: setup.notifications })) {
      setEditing(false);
      onComplete?.();
    }
  }

  return <section className="panel onboarding" aria-labelledby="setup-title">
    <div className="section-heading"><div><span className="eyebrow">ORCHARD PROFILE · LOCAL ONLY</span><h2 id="setup-title">Set up your orchard</h2></div></div>
    <p className="help">Add a few orchard details to personalize the workspace. Location is used only to set the orchard point and is not tracked.</p>
    <form onSubmit={submit}>
      <div className="setup-fields">
        <label>Orchard name *<input maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="off" required /></label>
        <label>Crop / orchard type<input maxLength={100} placeholder="e.g. Almond" value={crop} onChange={e => setCrop(e.target.value)} /></label>
        <label>Latitude *<input type="number" min="-85" max="85" step="any" value={lat} onChange={e => { setLat(e.target.value); setConfirmed(false); }} required /></label>
        <label>Longitude *<input type="number" min="-180" max="180" step="any" value={lng} onChange={e => { setLng(e.target.value); setConfirmed(false); }} required /></label>
        <label>Average tree height · ft <small>(optional)</small><input type="number" min="0.1" step="any" value={height} onChange={e => setHeight(e.target.value)} /></label>
      </div>
      <p className="help">Map tiles are provided by OpenStreetMap or Esri. The selected provider receives the viewed area and your IP address.</p>
      <div className="setup-actions"><button type="button" disabled={locating} onClick={() => loadLocation(true)}>{locating ? 'Loading location…' : 'Load current location'}</button><button className="primary" type="submit">Save orchard & open dashboard</button></div>
    </form>
    {mapVisible && <OrchardMap autoLoad location={location} boundary={boundary} onLocation={point => { setLat(point.lat.toFixed(6)); setLng(point.lng.toFixed(6)); setConfirmed(false); }} onBoundary={setBoundary} />}
    <label className="checkbox-label"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I confirm these coordinates represent my orchard.</label>
    {message && <p className="setup-message" role="status">{message}</p>}
    {error && <p className="storage-error" role="alert">{error}</p>}
    <div className="setup-actions"><button onClick={() => { setEditing(false); onComplete?.(); }}>Continue without saving</button>{error && <button onClick={clear}>Clear saved settings</button>}</div>
  </section>;
}

export function OrchardSetup({ controller }: { controller: SetupController }) {
  const { setup, error, save, clear, setEditing } = controller;
  const [step, setStep] = useState(1);
  const [name, setName] = useState(setup.orchard?.name ?? '');
  const [crop, setCrop] = useState(setup.orchard?.crop ?? '');
  const [height, setHeight] = useState(setup.orchard?.treeHeightFt?.toString() ?? '');
  const [lat, setLat] = useState(setup.orchard?.location.lat.toString() ?? '');
  const [lng, setLng] = useState(setup.orchard?.location.lng.toString() ?? '');
  const [boundary, setBoundary] = useState<Point[]>(setup.orchard?.boundary ?? []);
  const [locationConfirmed, setLocationConfirmed] = useState(!!setup.orchard);
  const [notificationEnabled, setNotificationEnabled] = useState(setup.notifications);
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const geoRequest = useRef(0);
  const candidate = { lat: Number(lat), lng: Number(lng) };
  const location = lat.trim() && lng.trim() && validPoint(candidate) ? candidate : null;
  const orchard: Orchard | null = location ? { name: name.trim(), location, boundary, crop: crop.trim(), treeHeightFt: height.trim() ? Number(height) : null } : null;
  function setPoint(p: Point) { setLat(p.lat.toFixed(6)); setLng(p.lng.toFixed(6)); setLocationConfirmed(false); }
  function locate() {
    if (!navigator.geolocation || !window.isSecureContext) { setMessage('Location is unavailable here. Enter coordinates or select a point on the map.'); return; }
    const request = ++geoRequest.current;
    setLocating(true); setMessage('');
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== geoRequest.current) return;
      setLocating(false); setPoint({ lat: position.coords.latitude, lng: position.coords.longitude });
      setMessage(`Location found (reported accuracy about ${Math.round(position.coords.accuracy)} m). Confirm this is the orchard, not just your current position.`);
    }, () => { if (request !== geoRequest.current) return; setLocating(false); setMessage('Location was denied or unavailable. You can still use the map or enter coordinates.'); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }
  async function enableNotifications() {
    if (!('Notification' in window) || !window.isSecureContext) { setMessage('System notifications are unavailable in this browser. In-page alerts still work.'); return; }
    try { const permission = await Notification.requestPermission(); setNotificationEnabled(permission === 'granted'); setMessage(permission === 'granted' ? 'Permission granted. Save settings to receive a notification for each new simulated observation while this page is open.' : 'Notifications are not enabled. In-page alerts still work; browser site settings control future permission changes.'); }
    catch { setMessage('Notification permission could not be requested. In-page alerts still work.'); }
  }
  function next() {
    if (!orchard || !validOrchard(orchard) || !locationConfirmed) { setMessage('Enter a name and valid coordinates, confirm the orchard location, and check optional height/boundary fields. A boundary needs at least three non-collinear corners.'); return; }
    geoRequest.current++; setLocating(false); setMessage(''); setStep(2);
  }
  function finish() {
    if (!orchard || !validOrchard(orchard) || !locationConfirmed) return;
    if (save({ version: 1, completed: true, orchard, notifications: notificationEnabled })) setEditing(false);
  }
  function skip() { geoRequest.current++; if (save({ ...setup, completed: true })) setEditing(false); }
  return <section className="panel onboarding" aria-labelledby="setup-title"><div className="section-heading"><div><span className="eyebrow">YOUR ORCHARD / {step === 1 ? 'LOCATION & DETAILS' : 'NOTIFICATIONS'}</span><h2 id="setup-title">{step === 1 ? 'Make this space yours.' : 'Choose how you hear from us.'}</h2></div><span className="step-label">Step {step} of 2</span></div><p className="help">Your orchard details are stored only on this device. They are not synced to a database. The weather dashboard remains a simulated demonstration, not measurements from your orchard.</p>
  {step === 1 ? <><div className="permission-card"><strong>Why we ask for your location</strong><p>Use your current position to help find your orchard. It may not be the orchard itself, so you must confirm the point. We request location once; we do not track your movement.</p><button type="button" disabled={locating} onClick={locate}>{locating ? 'Finding location…' : 'Use my location'}</button><button type="button" onClick={() => { geoRequest.current++; setLocating(false); setMessage('Location skipped. Select the orchard on the map or enter its coordinates.'); }}>Skip location permission</button></div>
  <OrchardMap location={location} boundary={boundary} onLocation={setPoint} onBoundary={setBoundary}/><div className="setup-fields"><label>Orchard name *<input maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="off"/></label><label>Crop type <small>(optional)</small><input maxLength={100} placeholder="e.g. Almond" value={crop} onChange={e => setCrop(e.target.value)}/></label><label>Latitude *<input type="number" min="-85" max="85" step="any" value={lat} onChange={e => { setLat(e.target.value); setLocationConfirmed(false); }}/></label><label>Longitude *<input type="number" min="-180" max="180" step="any" value={lng} onChange={e => { setLng(e.target.value); setLocationConfirmed(false); }}/></label><label>Average tree height · ft <small>(optional)</small><input type="number" min="0.1" step="any" value={height} onChange={e => setHeight(e.target.value)}/></label></div><label className="checkbox-label"><input type="checkbox" checked={locationConfirmed} onChange={e => setLocationConfirmed(e.target.checked)}/> I confirm this point represents my orchard.</label><button className="primary" onClick={next}>Continue to notifications →</button></> : <div className="permission-card"><strong>Why we offer notifications</strong><p>Receive an alert when the simulated weather status changes while this page is open. This version does not monitor real sensors or send alerts after you close the page.</p><button type="button" onClick={enableNotifications}>Enable browser notifications</button><button type="button" onClick={() => { setNotificationEnabled(false); setMessage('Notifications skipped. In-page alerts remain available.'); }}>Skip / turn off app notifications</button><p>App preference: {notificationEnabled ? 'enabled when permission is granted' : 'off'}.</p><div className="setup-actions"><button onClick={() => { setStep(1); setMessage(''); }}>← Back</button><button className="primary" onClick={finish}>Save orchard & open dashboard</button></div></div>}
  {message && <p className="setup-message" role="status">{message}</p>}{error && <p className="storage-error" role="alert">{error}</p>}<div className="setup-actions"><button onClick={skip}>{setup.orchard ? 'Cancel edits' : 'Skip setup for now'}</button><button onClick={() => setEditing(false)}>Continue without saving</button><button onClick={() => exportSetup({ version: 1, completed: false, orchard, notifications: notificationEnabled })}>Export draft</button>{error && <button onClick={clear}>Clear saved settings</button>}</div></section>;
}
