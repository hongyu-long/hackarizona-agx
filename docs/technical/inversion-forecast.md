# Local inversion forecast experiment

Run from the repository root with Node 22.18 or later:

```powershell
node scripts/forecast/run.mjs
```

This writes `outputs/forecast/experiment.json` and `report.json`. The default input is the existing SRER catalog. Supply one or two catalog paths as positional arguments to change sources. A seven-day shared time window is selected from the later first timestamp; it is not chosen using forecast outcomes. Two complete sites are required for the intended full experiment. Missing coverage remains explicit.

The partitions are the first four days for training, the fifth for validation, and the final two for testing. Examples use two completed consecutive intervals and the following interval as target. Only quality-passed aligned records are eligible. The target is inversion presence in the next 30-minute average, not instantaneous onset or actual drift. Publication latency of archived tower observations is not established.

Model execution is optional. The runner loads `.env` from the repository root when present; environment variables already set by the shell take precedence. Example local settings:

```dotenv
FORECAST_PYTHON=.venv-forecast\Scripts\python.exe
FORECAST_MODEL_PATH=
FORECAST_CONTEXT=
```

Then run:

```powershell
node scripts/forecast/run.mjs
```

Install the pinned Python environment from `scripts/forecast/requirements.lock.txt` in an isolated environment. Model access may require the provider's account/license process. An existing checkpoint can be supplied using `FORECAST_MODEL_PATH`; it is never downloaded into browser assets. Model failures retain the baseline and an explicit diagnostic. The classification threshold is fixed at 0.5. Fewer validation errors selects TabPFN; ties retain persistence. Test outcomes do not select settings. This experiment has not calibrated probabilities.

Optional cloud context is supplied with `FORECAST_CONTEXT`, pointing to a JSON array. Each record requires `site`, UTC `validFrom`, `validTo`, `availableAt`, `cloudPercent` (0–100), `source`, `latitude`, `longitude`, and `matchingMethod`. Site mapping and availability must be independently verified from source metadata; filling these fields is not scientific verification. Rows issued after the cutoff are excluded. Hourly context remains valid over its supplied interval; it is not relabeled as a half-hour observation. Height-specific temperature and wind, direction, temperature differences and recent temperature changes are tower predictors; observation heights are included as numeric predictors. Cloud cover is an optional context predictor. Fog, terrain/geographic predictors, machine settings and pesticide properties are not included. Geographic coordinates are used only for source matching and provenance. The report retains matched evaluation counts and context source records.

Import `report.json` into the forecast panel. It shows a site/time selector, future interval, model probability when available, separate reliability and input-quality text, actual sensor heights, source attribution and limitations. The persistence baseline has no invented probability. Save/export uses a separate versioned local forecast archive and does not alter weather-screening evidence. Corrupt archives are not overwritten; storage failures remain visible. Exported evidence carries both input intervals, quality flags, units and physical heights. A full archive refuses additional writes at 1,000 records.

## Verified local outcome (2026-11-15)

- The `.env`-configured local Python 3.14.7 environment ran TabPFN 10.0.0, model version `ModelVersion.V3_5`.
- SRER first-week experiment: 336 raw rows, 284 eligible examples; train 160, validation 42, test 82. The tower model used 15 predictors: two-height temperature and wind, wind direction, temperature differences and changes, and measurement heights.
- Validation selected TabPFN over persistence (1 versus 2 classification errors). On the held-out test partition, TabPFN had 2 missed inversions and 0 false alarms, compared with persistence's 2 misses and 2 false alarms. TabPFN missed both onset cases; persistence missed both onset and both dissipation cases.
- This single-site, seven-day result is a tiny exploratory comparison, not orchard validation, calibrated probability or evidence of useful operational performance. A second verified station and eligible archived cloud data were not obtained; the two-site/context comparison remains incomplete.

## Review

The independent standards review found no hard violations and suggested consolidating model invocation and feature ordering; both were addressed. The spec review identified source evidence, input references, separate transition metrics, record limits and model identity gaps. The first four were addressed; the runner records package/model configuration, but actual checkpoint verification remains blocked by the local runtime policy.
