# Demo and orchard setup

## Three-minute demo

1. Select **Baseline**. Inspect both heights and the GO explanation.
2. Select **Hidden inversion**. The lower-only wind check still finds no flag, but upper air is 4°C warmer and SprayWise reports STOP.
3. Select **Upper wind**. Inspect both the upper wind and speed-shear reasons.
4. Open **View evidence** in the observation log to show exact readings, UTC observation/evaluation times, rules and triggers. Reload to demonstrate persistence.
5. Select **Sensor missing**. The status becomes UNAVAILABLE rather than implying favorable conditions.

Each scenario click and reassessment creates one new record. Initial page preview does not create a record. Snapshots are explicitly simulated and remain fixed; they are not a live monitoring feed. The evaluator validates freshness against an explicit reference time.

## First-use orchard setup

The first visit offers a skippable setup panel. Location is requested only after clicking **Use my location**, with a purpose explanation, timeout and manual fallback. Confirm the point is the orchard before saving. Enter an orchard name and coordinates; crop, tree height and a user-drawn boundary are optional.

**Load street map** enables Leaflet/OpenStreetMap tiles after a disclosure that the viewed area and IP address go to the provider. Click the map to choose a point; use Draw boundary, Undo corner and Reset boundary to edit a polygon. This is a real street basemap, not satellite imagery; no geocoding search or real tower discovery is connected. Manual coordinate entry works without contacting a map provider.

After details, the optional notification step requests permission only on a button click. Enabled notifications report simulated status changes while the page is open. No background monitoring or push service is implemented; unsupported/denied notifications fall back to the existing page alerts. Geolocation and system notification permissions require a supported secure context (HTTPS or localhost). See [MDN geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) and [notification permission](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static).

Orchard settings use a separate, versioned `spraywise.setup.v1` localStorage key. Edit, export and explicitly clear them from the orchard panel. A storage failure stays visible and offers draft export or continuing without saving. Clearing app settings does not revoke browser permissions or delete observation logs. No database synchronization exists yet.

Real source feasibility is recorded in [weather-tower-data.md](../research/weather-tower-data.md), with verified sources and unresolved sensor-height/access constraints.
