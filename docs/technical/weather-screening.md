# Weather screening and storage

Implementation: [risk evaluator](../../src/features/weather/risk.ts), [observation storage](../../src/features/weather/storage.ts).

## Rules

- Upper temperature greater than lower: STOP.
- Either wind speed below 3 or above 10 mph: STOP. Exact bounds are included.
- Absolute speed difference at least 4 mph: CAUTION; at least 7: STOP.
- Circular direction difference at least 45°: CAUTION; at least 90°: STOP.
- Direction comparison is skipped below 3 mph, where low-wind alerts apply.
- Missing, invalid, stale (>120 s), future (>5 s), or mismatched (>60 s apart) readings: UNAVAILABLE. Pair validation precedes risk analysis; invalid pairs do not generate partial weather alerts in this MVP.
- All triggered reasons are retained; STOP takes precedence over CAUTION, then GO.

Shear thresholds are adjustable demonstration choices, not validated universal safety limits. The form reevaluates the selected scenario and logs the new configuration without changing historical records. Units are fixed to °C, mph, degrees from true north, and feet above ground. Sensor uncertainty and real data ingestion are outside this MVP.

## Observation storage and limitations

Logs use `localStorage` key `spraywise.evaluations.v1`. Export JSON to retain a portable copy. Storage failure is shown as **Not saved**, with in-memory records retained for export/retry. At 1,000 persisted records, further writes are refused without silent deletion; export and explicitly clear the log to resume. Corrupt stored data is preserved until explicit clearing.

This is decision support, not authorization to spray. Follow pesticide labels, on-site checks and regulations. GO means no configured weather flags, not zero drift risk. No ML, actual drift trajectory, forecasts, geographic modeling or live sensors are included.

## Supplied historical test cases

The Forecast experiment page also replays the two CSV files in `DataEvaluation/` through the rule evaluator. These are past test cases, not a live feed, a TabPFN forecast, or independently verified orchard measurements. Each dataset contains 4,320 ten-minute rows for June 2026 with temperature, wind speed and direction at the CSV's 5 ft and 30 ft levels. Source attribution, timestamp timezone, sensor quality flags, cloud/fog, geography, equipment and pesticide properties are not supplied, so they are not inferred or modeled. Case timestamps are shown exactly as stored; an internal UTC normalization is used only to run the evaluator's same-time validation.

Results summarize configured demonstration rules only. They are not validated spray recommendations.
