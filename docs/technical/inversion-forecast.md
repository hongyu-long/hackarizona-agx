# Local inversion forecast experiment

Run from the repository root with Node 22.18 or later:

```powershell
node scripts/forecast/run.mjs
```

This writes `outputs/forecast/experiment.json` and `report.json`. The default input is the existing SRER catalog. Supply one or two catalog paths as positional arguments to change sources. A seven-day shared time window is selected from the later first timestamp; it is not chosen using forecast outcomes. Two complete sites are required for the intended full experiment. Missing coverage remains explicit.

The partitions are the first four days for training, the fifth for validation, and the final two for testing. Examples use two completed consecutive intervals and the following interval as target. Only quality-passed aligned records are eligible. The target is inversion presence in the next 30-minute average, not instantaneous onset or actual drift. Publication latency of archived tower observations is not established.

Model execution is optional:

```powershell
$env:FORECAST_PYTHON = Join-Path (Get-Location) '.venv-forecast\Scripts\python.exe'
node scripts/forecast/run.mjs
```

Install the pinned Python environment from `scripts/forecast/requirements.lock.txt` in an isolated environment. Model access may require the provider's account/license process. An existing checkpoint can be supplied using `FORECAST_MODEL_PATH`; it is never downloaded into browser assets. Model failures retain the baseline and an explicit diagnostic. The classification threshold is fixed at 0.5. Fewer validation errors selects TabPFN; ties retain persistence. Test outcomes do not select settings. This experiment has not calibrated probabilities.

Optional cloud context is supplied with `FORECAST_CONTEXT`, pointing to a JSON array. Each record requires `site`, UTC `validFrom`, `validTo`, `availableAt`, `cloudPercent` (0–100), `source`, `latitude`, `longitude`, and `matchingMethod`. Site mapping and availability must be independently verified from source metadata; filling these fields is not scientific verification. Rows issued after the cutoff are excluded. Hourly context remains valid over its supplied interval; it is not relabeled as a half-hour observation. Only cloud cover is currently used; humidity is not implemented. The report retains matched evaluation counts and context source records. Geographic values are not predictive inputs.

Import `report.json` into the forecast panel. It shows a site/time selector, future interval, model probability when available, separate reliability and input-quality text, actual sensor heights, source attribution and limitations. The persistence baseline has no invented probability. Save/export uses a separate versioned local forecast archive and does not alter weather-screening evidence. Corrupt archives are not overwritten; storage failures remain visible. Exported evidence carries both input intervals, quality flags, units and physical heights. A full archive refuses additional writes at 1,000 records.

## Verified local outcome (2026-11-15)

- Python 3.14.7 and TabPFN 10.0.0 dependencies were installed in an ignored virtual environment.
- Real model execution failed before model loading: Windows Application Control blocked NumPy's `_umath_linalg` DLL. No TabPFN predictions or accuracy are claimed, and no attempt was made to bypass that policy.
- SRER first-week baseline: 336 raw rows, 284 eligible examples; train 160, validation 42, test 82.
- Test support: 35 inversion and 47 non-inversion cases; 2 missed inversions and 2 false alarms. Both onsets and both dissipations were mispredicted. High overall persistence accuracy does not establish useful transition prediction.
- A second verified station and eligible archived cloud data were not obtained. The full two-site/model/context comparison remains incomplete.

## Review

The independent standards review found no hard violations and suggested consolidating model invocation and feature ordering; both were addressed. The spec review identified source evidence, input references, separate transition metrics, record limits and model identity gaps. The first four were addressed; the runner records package/model configuration, but actual checkpoint verification remains blocked by the local runtime policy.
