# Small-data inversion forecasting with TabPFN

Status: ready-for-agent

## Problem Statement

Orchard applicators can inspect current or historical multi-height observations and understand configured weather alerts, but cannot see whether an inversion is likely in the next observation interval. The team needs a small, reproducible experiment to determine whether a pretrained tabular model adds predictive value over persistence, and whether additional weather context helps. Model probability must not be mistaken for demonstrated accuracy or authorization to spray.

## Solution

Build a local historical forecasting experiment using two sites and seven consecutive days per site, with no more than 672 raw 30-minute site-interval records. Compare a pretrained TabPFN classifier with persistence. Predict whether the next 30-minute interval has upper mean temperature greater than lower mean temperature. Compare tower-only features with tower features plus eligible cloud cover and other weather context.

Present historical forecasts alongside existing observations and rule-based screening. Show inversion probability when supplied by the model, an explicit uncalibrated small-sample reliability statement, and separate input-quality information. Preserve negative findings and report missing prerequisites honestly. Forecasts never override GO / CAUTION / STOP / UNAVAILABLE screening.

## User Stories

1. As a reviewer, I want a very small dataset so that I can reproduce the experiment locally.
2. As a reviewer, I want two sites and multiple dates so that the experiment is not limited to one site's timeline.
3. As a reviewer, I want site identity and ecosystem disclosed so that non-orchard data is not presented as orchard validation.
4. As an applicator, I want actual observation heights displayed so that I understand which layers are compared.
5. As a reviewer, I want temperature and wind observations aligned by site and interval so that comparisons are physically meaningful.
6. As a reviewer, I want quality flags and excluded-record counts retained so that I can audit the usable sample.
7. As a reviewer, I want source attribution, units and provenance preserved so that data transformations are traceable.
8. As an applicator, I want the forecast's cutoff and target interval shown so that I know which future period it describes.
9. As an applicator, I want a prediction of next-interval inversion presence so that I can inspect possible changes in conditions.
10. As a reviewer, I want interval averages distinguished from instantaneous measurements so that temporal precision is not overstated.
11. As a reviewer, I want recent weather changes included only from past information so that predictions do not use their own answers.
12. As a reviewer, I want a pretrained tabular model evaluated without initial fine-tuning so that the experiment stays small.
13. As a reviewer, I want a persistence baseline so that model complexity has a meaningful comparison.
14. As a reviewer, I want chronological training, validation and test partitions so that later observations cannot train earlier predictions.
15. As a reviewer, I want missed inversions and false alarms reported so that overall accuracy does not hide relevant errors.
16. As a reviewer, I want inversion onset and dissipation examined separately so that persistence through stable periods does not obscure transitions.
17. As a reviewer, I want raw counts and class support beside metrics so that tiny test samples remain apparent.
18. As a reviewer, I want tower-only and context-enhanced predictions compared on the same eligible cases so that differences are attributable to context.
19. As a reviewer, I want cloud cover matched by location and time so that additional information has a defined relationship to each example.
20. As a reviewer, I want context availability at the forecast cutoff checked so that retrospective data does not masquerade as a deployable forecast input.
21. As a reviewer, I want geographic information used for matching and display so that two-site identifiers are not mistaken for learned geographic effects.
22. As an applicator, I want model-estimated inversion probability displayed separately from reliability so that a percentage is not mistaken for accuracy.
23. As an applicator, I want uncalibrated small-sample predictions explicitly identified so that confidence is not overstated.
24. As an applicator, I want input-data quality displayed separately so that good inputs are not confused with reliable predictions.
25. As an applicator, I want unavailable predictions to include a reason so that missing data is not interpreted as no inversion.
26. As a developer, I want typed contracts and runtime checks so that malformed external data cannot become a normal forecast.
27. As an applicator, I want existing weather statuses preserved so that a low predicted probability cannot erase an observed inversion alert.
28. As a reviewer, I want forecast evidence saved and exported so that the displayed result can be traced to its inputs and model.
29. As a reviewer, I want the baseline retained when TabPFN does not improve on it so that negative findings remain visible.
30. As a reviewer, I want a tower-only result when eligible cloud data is unavailable so that an optional source does not prevent useful progress.
31. As a reviewer, I want model and dependency versions recorded so that the experiment is reproducible.
32. As an applicator, I want historical forecasts clearly labeled so that I cannot mistake replay for live monitoring.

## Implementation Decisions

- Extend the existing React/TypeScript weather application and its historical replay and evidence-storage boundaries. Preserve existing historical replay work; this is a separate feature from the earlier replay specification.
- Use an offline local experiment runner and a versioned, runtime-validated forecast artifact consumed by the application. Do not assume the Python model executes inside the browser; a hosted model service is not required.
- Use TabPFN as the initial pretrained candidate without fine-tuning. Verify the exact model/package version, access conditions and local execution before running; record these choices. Do not promise runtime or model quality before measurement.
- Target two sites with seven consecutive days each and 30-minute records, at most 672 raw observations before exclusions, lag construction and future-label construction. SRER's existing catalog is a candidate; verify a second site's metadata, paired measurements and coverage. Select date windows without optimizing for test outcomes and freeze the selection.
- Preserve physical observation heights, separate temperature/wind sensor positions where available, source units, interval boundaries, quality flags, source/retrieval metadata and attribution. Do not treat a level identifier as a physical height or another station as a second tower level.
- For cutoff t, the target is upper mean temperature greater than lower mean temperature over [t, t + 30 minutes). Use only completed prior intervals as features. Do not label a missing or unusable next interval as non-inversion or bridge gaps into false adjacent examples.
- This is a historical pseudo-forecast using observations as of their interval boundaries. Historical tower availability latency must be disclosed if real-time availability cannot be established; do not claim operational real-time performance.
- Tower inputs include paired temperature, wind speed and direction and recent changes. Compute changes within site and across verified consecutive intervals. Treat wind direction circularly. Freeze exact feature definitions before final testing.
- Add cloud cover to the context experiment when availability is verifiable; humidity is an optional additional context candidate. Record source location, spatial matching, time resolution, valid time and issue/availability time where relevant. Do not use later reanalysis as though it had been available at the forecast cutoff. Do not create artificial half-hour observations from hourly context.
- Geographic information is for matching and display, not predictive inputs in this experiment. Preserve observation height as measurement metadata; distinguish it from ground elevation.
- Use chronological partitions with documented cutoffs. Exclude examples whose targets cross partition boundaries. Fit any preprocessing on training data only; select settings with validation data and leave final test data untouched until evaluation. Keep both sites on compatible time cutoffs where dates overlap. Do not claim generalization to unseen sites from this design.
- Persistence predicts the next interval's inversion state from the most recent usable completed interval. Do not fabricate a confidence percentage for a binary baseline prediction.
- Compare tower-only TabPFN, context-enhanced TabPFN and persistence on identical eligible test examples for the context comparison. Also report tower-only coverage on the broader eligible sample. Record exclusions rather than silently reducing the sample.
- Report confusion counts, missed inversions, false alarms, class support and onset/dissipation results. Freeze any classification threshold and model-selection criterion using validation data, document the tradeoff, and never choose a winner by tuning on the final test set. Small samples may support no reliable conclusion.
- Use typed, discriminated available/unavailable forecast results and runtime validation at data-import and forecast-artifact boundaries. Validate timestamps, intervals, identifiers, units, finite values, and probability range. Missing values must not default to zero. Keep probability absent for predictors that do not supply one.
- Forecast evidence includes site, cutoff, target interval, input references and quality, predictor identity/version, feature variant, prediction/probability when available, reliability statement, and generation time separate from observation time.
- Display model-estimated inversion probability, uncalibrated small-sample reliability and input-data quality separately. Do not imply probability equals accuracy or assign unsupported high/medium/low confidence categories.
- Keep forecasts separate from rule-based weather screening and preserve existing evidence behavior. A forecast cannot change an observed STOP to GO.
- If TabPFN does not demonstrate improvement, present the baseline and retain the comparison. If eligible context cannot be verified, complete the tower-only experiment and report the omitted comparison. Missing second-site data remains an explicit unmet scope requirement, not an invented record.

## Testing Decisions

- Primary seam accepted by the subsequent implement instruction: the user-visible historical forecast flow from site/time selection through prediction display and evidence save/export, reusing historical replay and storage interfaces.
- Use one additional offline experiment boundary to test behavior that UI fixtures cannot establish: eligible-input construction, correct future labels, chronological partitioning, leakage prevention and baseline/model comparisons. Avoid tests of private model internals or helper implementation details.
- Existing historical replay tests are prior art for real-data fixtures, site/time lookup, actual heights, local/UTC formatting, quality-flagged unavailability and evidence round trips. Existing evaluator and storage tests cover weather status and persistence behavior.
- Test that future-temperature mutations change labels but never cutoff-time features; reject late-issued context and exclude labels crossing split boundaries. Check gaps, interleaved sites, invalid flags and missing target intervals.
- Test that a persistence forecast matches the current observed inversion state, transitions are categorized correctly, and comparisons use the same case identifiers. Report unsupported metrics as unavailable rather than dividing by zero or inventing scores.
- Validate imported artifacts with valid probabilities, absent probabilities, out-of-range values, nonfinite numbers, invalid intervals, unknown versions and unavailable results. Ensure invalid artifacts cannot render favorable normal predictions.
- At the primary flow, verify probability/reliability/quality separation, historical labeling, retained current STOP status, baseline-without-probability display, context-unavailable fallback and complete exported evidence.
- Run model integration as a small reproducible local smoke experiment, separate from deterministic UI tests. Do not require live API access, downloads or stochastic quality claims in the normal test suite. A trained model beating persistence is an empirical outcome, not an assertion tests must force to pass.
- Run the existing test suite and production type-check/build after implementation; this specification-only change does not require model execution.

## Out of Scope

- Pretraining a foundation model from scratch, initial fine-tuning, large datasets or paid compute commitments.
- Quantitative spray drift, deposition or vapor-drift prediction; equipment recommendations or pesticide-label interpretation.
- Terrain, elevation, land-cover or site-identity predictors; claims of transfer to unseen orchards.
- Live monitoring, background alerts, hosted inference, cloud deployment or automatic remote polling.
- Calibrated confidence claims, statistical guarantees or invented high/medium/low reliability categories from this tiny dataset.
- Replacing current screening, treating GO as spray authorization, or treating an experimental forecast as validated operational advice.

## Further Notes

- Implementation update (2026-11-15): local experiment, typed/runtime-validated evidence, baseline, cloud-context interface, and Forecast experiment page are implemented. Full model validation remains blocked by Windows Application Control preventing NumPy DLL loading; second-site data and time-eligible cloud data remain unmet prerequisites. Do not treat this as a completed two-site model comparison.

- The user confirmed the overall design and invoked to-spec to publish it; implementation is not part of this specification-writing task.
- The existing local catalog contains 1,440 SRER 30-minute records from June 2024. This establishes a candidate data source, not the final quality-filtered experiment sample. The raw-download manifest referenced in earlier research was absent during inspection.
- Second-site access, source-time eligibility for cloud data, and exact model execution remain implementation feasibility checks. Record limitations and preserve partial experimental results without marking unmet requirements complete.
- The user requested a very small dataset but supplied no demo deadline or monetary budget. Do not infer authorization for paid services.
- No ADR is necessary for this reversible experiment. Use the glossary's inversion forecast, multi-height observation, observation height and observed wind profile terminology.

