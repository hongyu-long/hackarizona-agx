import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from './orchard';

type Props = { location: Point | null; boundary: Point[]; onLocation: (p: Point) => void; onBoundary: (points: Point[]) => void; autoLoad?: boolean };
export function OrchardMap(props: Props) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlays = useRef<L.LayerGroup | null>(null);
  const tileLayer = useRef<L.TileLayer | null>(null);
  const [enabled, setEnabled] = useState(props.autoLoad ?? false);
  const [baseLayer, setBaseLayer] = useState<'street' | 'satellite'>('street');
  const [drawing, setDrawing] = useState(false);
  const [tileError, setTileError] = useState(false);
  const latest = useRef({ ...props, drawing }); latest.current = { ...props, drawing };
  useEffect(() => {
    if (!enabled || !node.current) return;
    const center = latest.current.location;
    const instance = L.map(node.current).setView(center ? [center.lat, center.lng] : [36.75, -119.77], center ? 16 : 8);
    map.current = instance;
    overlays.current = L.layerGroup().addTo(instance);
    instance.on('click', (event: L.LeafletMouseEvent) => {
      const p = { lat: event.latlng.lat, lng: event.latlng.wrap().lng };
      if (latest.current.drawing) latest.current.onBoundary([...latest.current.boundary, p]);
      else latest.current.onLocation(p);
    });
    return () => { instance.remove(); map.current = null; overlays.current = null; };
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !map.current) return;
    const config = baseLayer === 'street'
      ? { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
      : { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community' };
    const layer = L.tileLayer(config.url, { maxZoom: 19, attribution: config.attribution })
      .on('tileerror', () => setTileError(true))
      .addTo(map.current);
    tileLayer.current = layer;
    setTileError(false);
    return () => {
      layer.remove();
      if (tileLayer.current === layer) tileLayer.current = null;
    };
  }, [enabled, baseLayer]);
  useEffect(() => {
    if (!overlays.current || !map.current) return;
    overlays.current.clearLayers();
    if (props.location) {
      const pointer = L.divIcon({ className: 'current-location-pointer', html: '<span></span>', iconSize: [28, 38], iconAnchor: [14, 36] });
      L.marker([props.location.lat, props.location.lng], { icon: pointer }).bindTooltip('Your current location / orchard point. No sensor connected.').addTo(overlays.current);
    }
    const points = props.boundary.map(p => [p.lat, p.lng] as L.LatLngTuple);
    if (points.length >= 3) L.polygon(points, { color: '#fff', weight: 8, opacity: 0.95, fillOpacity: 0 }).addTo(overlays.current);
    else if (points.length) L.polyline(points, { color: '#fff', weight: 8, opacity: 0.95 }).addTo(overlays.current);
    if (points.length >= 3) L.polygon(points, { color: '#ff3b30', weight: 4, fillColor: '#ff3b30', fillOpacity: 0.14 }).addTo(overlays.current);
    else if (points.length) L.polyline(points, { color: '#ff3b30', weight: 4 }).addTo(overlays.current);
    points.forEach(point => {
      L.circleMarker(point, { radius: 7, color: '#fff', weight: 4, fillColor: '#fff', fillOpacity: 1 }).addTo(overlays.current!);
      L.circleMarker(point, { radius: 4, color: '#b51f19', weight: 2, fillColor: '#ff3b30', fillOpacity: 1 }).addTo(overlays.current!);
    });
  }, [props.location, props.boundary, enabled]);
  useEffect(() => {
    if (props.location) map.current?.panTo([props.location.lat, props.location.lng]);
  }, [props.location?.lat, props.location?.lng, enabled]);
  if (!enabled) return <div className="map-consent"><strong>Locate your orchard on a street map</strong><p>Loading map tiles contacts the selected map provider. Requests reveal the viewed area and your IP address. You can use coordinates instead without loading a map.</p><button type="button" onClick={() => setEnabled(true)}>Load street map</button></div>;
  return <div><div className="map-toolbar"><div className="map-tabs" role="tablist" aria-label="Map style"><button type="button" role="tab" aria-selected={baseLayer === 'street'} onClick={() => setBaseLayer('street')}>OpenStreetMap</button><button type="button" role="tab" aria-selected={baseLayer === 'satellite'} onClick={() => setBaseLayer('satellite')}>Satellite</button></div><button type="button" aria-pressed={!drawing} onClick={() => setDrawing(false)}>Place orchard point</button><button type="button" aria-pressed={drawing} onClick={() => setDrawing(true)}>Draw boundary</button><button type="button" disabled={!props.boundary.length} onClick={() => props.onBoundary(props.boundary.slice(0, -1))}>Undo corner</button><button type="button" disabled={!props.boundary.length} onClick={() => props.onBoundary([])}>Reset boundary</button></div><p className="help">{drawing ? 'Click each boundary corner in order around the orchard. Three or more corners close the shape automatically. Switch to Place orchard point when finished.' : 'The pin marks your current location / orchard point. Click the map to move it. This is not a weather tower.'}</p><div ref={node} className="orchard-map" aria-label={`Interactive ${baseLayer === 'street' ? 'OpenStreetMap street' : 'satellite'} map`}/>{tileError && <p role="status">Map tiles could not load. Check your connection or enter coordinates below.</p>}<small>{props.boundary.length} boundary corners · Approximate user-drawn boundary, not a surveyed property line</small></div>;
}
