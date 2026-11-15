import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from './orchard';

type Props = { location: Point | null; boundary: Point[]; onLocation: (p: Point) => void; onBoundary: (points: Point[]) => void };
export function OrchardMap(props: Props) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlays = useRef<L.LayerGroup | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [tileError, setTileError] = useState(false);
  const latest = useRef({ ...props, drawing }); latest.current = { ...props, drawing };
  useEffect(() => {
    if (!enabled || !node.current) return;
    const center = latest.current.location;
    const instance = L.map(node.current).setView(center ? [center.lat, center.lng] : [36.75, -119.77], center ? 16 : 8);
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).on('tileerror', () => setTileError(true)).addTo(instance);
    overlays.current = L.layerGroup().addTo(instance);
    instance.on('click', (event: L.LeafletMouseEvent) => {
      const p = { lat: event.latlng.lat, lng: event.latlng.wrap().lng };
      if (latest.current.drawing) latest.current.onBoundary([...latest.current.boundary, p]);
      else latest.current.onLocation(p);
    });
    return () => { instance.remove(); map.current = null; overlays.current = null; };
  }, [enabled]);
  useEffect(() => {
    if (!overlays.current || !map.current) return;
    overlays.current.clearLayers();
    if (props.location) {
      L.circleMarker([props.location.lat, props.location.lng], { radius: 9, color: '#244c39', fillOpacity: 1, fillColor: '#b8d78c' }).bindTooltip('User-selected orchard location. No sensor connected.').addTo(overlays.current);
    }
    const points = props.boundary.map(p => [p.lat, p.lng] as L.LatLngTuple);
    if (points.length >= 3) L.polygon(points, { color: '#496f37', fillOpacity: 0.18 }).addTo(overlays.current);
    else if (points.length) L.polyline(points, { color: '#496f37' }).addTo(overlays.current);
    points.forEach(p => L.circleMarker(p, { radius: 4, color: '#496f37' }).addTo(overlays.current!));
  }, [props.location, props.boundary, enabled]);
  useEffect(() => {
    if (props.location) map.current?.panTo([props.location.lat, props.location.lng]);
  }, [props.location?.lat, props.location?.lng, enabled]);
  if (!enabled) return <div className="map-consent"><strong>Locate your orchard on a real street map</strong><p>Loading the map contacts OpenStreetMap. Tile requests reveal the viewed area and your IP address to the map provider. You can use coordinates instead without loading a map.</p><button type="button" onClick={() => setEnabled(true)}>Load street map</button></div>;
  return <div><div className="map-toolbar"><button type="button" aria-pressed={!drawing} onClick={() => setDrawing(false)}>Place orchard point</button><button type="button" aria-pressed={drawing} onClick={() => setDrawing(true)}>Draw boundary</button><button type="button" disabled={!props.boundary.length} onClick={() => props.onBoundary(props.boundary.slice(0, -1))}>Undo corner</button><button type="button" disabled={!props.boundary.length} onClick={() => props.onBoundary([])}>Reset boundary</button></div><p className="help">{drawing ? 'Click each boundary corner in order around the orchard. Three or more corners close the shape automatically. Switch to Place orchard point when finished.' : 'Click to place or move the orchard point. This is a location marker, not an actual weather tower.'}</p><div ref={node} className="orchard-map" aria-label="Interactive orchard street map"/>{tileError && <p role="status">Map tiles could not load. Check your connection or enter coordinates below.</p>}<small>{props.boundary.length} boundary corners · Approximate user-drawn boundary, not a surveyed property line</small></div>;
}
