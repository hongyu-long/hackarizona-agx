# SprayWise

An explainable orchard weather screening MVP. Uses simulated temperature, wind speed and wind direction at 5 ft and 30 ft above ground. All processing and logs stay in the browser.

## Run

Requires Node.js 22.12+ (tested with Node 26). On Windows PowerShell use `npm.cmd` if script execution policy blocks `npm`.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm test` for evaluator/storage tests and `npm run build` for type checking and a production build. `npm run preview` serves the production build.

## Three-minute demo

1. Select **Baseline**. Inspect both heights and the GO explanation.
2. Select **Hidden inversion**. The lower-only wind check still finds no flag, but upper air is 4°C warmer and SprayWise reports STOP.
3. Select **Upper wind**. Inspect both the upper wind and speed-shear reasons.
4. Open **View evidence** in the observation log to show exact readings, UTC observation/evaluation times, rules and triggers. Reload to demonstrate persistence.
5. Select **Sensor missing**. The status becomes UNAVAILABLE rather than implying favorable conditions.

Each scenario click and reassessment creates one new record. Initial page preview does not create a record. Snapshots are explicitly simulated and remain fixed; they are not a live monitoring feed. The evaluator validates freshness against an explicit reference time.

## Rules

- Upper temperature greater than lower: STOP.
- Either wind speed below 3 or above 10 mph: STOP. Exact bounds are included.
- Absolute speed difference at least 4 mph: CAUTION; at least 7: STOP.
- Circular direction difference at least 45°: CAUTION; at least 90°: STOP.
- Direction comparison is skipped below 3 mph, where low-wind alerts apply.
- Missing, invalid, stale (>120 s), future (>5 s), or mismatched (>60 s apart) readings: UNAVAILABLE. Pair validation precedes risk analysis; invalid pairs do not generate partial weather alerts in this MVP.
- All triggered reasons are retained; STOP takes precedence over CAUTION, then GO.

Shear thresholds are adjustable demonstration choices, not validated universal safety limits. The form reevaluates the selected scenario and logs the new configuration without changing historical records. Units are fixed to °C, mph, degrees from true north, and feet above ground. Sensor uncertainty and real data ingestion are outside this MVP.

## First-use orchard setup

The first visit offers a skippable setup panel. Location is requested only after clicking **Use my location**, with a purpose explanation, timeout and manual fallback. Confirm the point is the orchard before saving. Enter an orchard name and coordinates; crop, tree height and a user-drawn boundary are optional.

**Load street map** enables Leaflet/OpenStreetMap tiles after a disclosure that the viewed area and IP address go to the provider. Click the map to choose a point; use Draw boundary, Undo corner and Reset boundary to edit a polygon. This is a real street basemap, not satellite imagery; no geocoding search or real tower discovery is connected. Manual coordinate entry works without contacting a map provider.

After details, the optional notification step requests permission only on a button click. Enabled notifications report simulated status changes while the page is open. No background monitoring or push service is implemented; unsupported/denied notifications fall back to the existing page alerts. Geolocation and system notification permissions require a supported secure context (HTTPS or localhost). See [MDN geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) and [notification permission](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static).

Orchard settings use a separate, versioned `spraywise.setup.v1` localStorage key. Edit, export and explicitly clear them from the orchard panel. A storage failure stays visible and offers draft export or continuing without saving. Clearing app settings does not revoke browser permissions or delete observation logs. No database synchronization exists yet.

Real source feasibility is recorded in [weather-tower-data.md](research/weather-tower-data.md), with verified sources and unresolved sensor-height/access constraints.

## Observation storage and limitations

Logs use `localStorage` key `spraywise.evaluations.v1`. Export JSON to retain a portable copy. Storage failure is shown as **Not saved**, with in-memory records retained for export/retry. At 1,000 persisted records, further writes are refused without silent deletion; export and explicitly clear the log to resume. Corrupt stored data is preserved until explicit clearing.

This is decision support, not authorization to spray. Follow pesticide labels, on-site checks and regulations. GO means no configured weather flags, not zero drift risk. No ML, actual drift trajectory, forecasts, geographic modeling or live sensors are included.
