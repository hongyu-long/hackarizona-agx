# Spray factors and data candidates

Checked 2026-11-15. Discovery notes for an ongoing design interview; these are not accepted product requirements or validated operational thresholds. No API payloads or Kaggle files were downloaded in this review.

## Existing implementation

README.md and src/features/weather/risk.ts implement simulated paired temperature, wind speed and direction screening. They do not model equipment, formulation, humidity, deposition or vapor transport. Existing numeric thresholds are demonstration choices, not a calibrated drift model.

## Candidate sources

| Source | Potential use | Outstanding limits |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/en/docs) | Regional modeled weather: temperature/humidity at 2 m, wind at 10/80/120/180 m, clouds and precipitation | Model output, not orchard sensor readings; cannot supply arbitrary canopy-height measurements |
| [Iowa Atmospheric Observatory](https://mesonet.agron.iastate.edu/projects/iao/), [IEM API](https://mesonet.agron.iastate.edu/api/) | Historical wind, direction, temperature and RH profiles at 5/10/20/40/80/120 m; talltowers.py endpoint listed | June 2016-August 2021 record; row crops/wind farm rather than orchard; verify sample payload, quality flags and metadata |
| [NEON](https://www.neonscience.org/resources/learning-hub/tutorials/neon-api-intro-requests-py) | Multi-height historical wind DP1.00001.001 and temperature DP1.00002.001 | Verify overlapping levels and times in sensor-position metadata; see weather-tower-data.md for previous access findings |
| [EPA PPLS API](https://www.epa.gov/pesticide-labels/pesticide-product-label-system-ppls-application-program-interface-api) | Product identity, registration number, ingredients, formulation and label PDF links | Documented schema does not supply a ready-to-use drift model or structured label wind limits; endpoint examples need live testing |
| [NPIC vapor pressure](https://npic.orst.edu/factsheets/vaporpressure.html) | Interpret volatility and its relationship to formulation | Ingredient vapor pressure alone does not describe an entire formulated product; retain temperature and units |

Kaggle candidates located: [Weather in Szeged](https://www.kaggle.com/datasets/budincsevity/szeged-weather), [World Weather Repository](https://www.kaggle.com/datasets/nelgiriyewithana/global-weather-repository), [AV Agriculture](https://www.kaggle.com/datasets/girishkurup/av-agriculture). Dynamic pages did not expose usable schema text during review. File contents, licenses, height metadata and drift outcome labels are unverified. No reviewed Kaggle dataset has yet been established as suitable for training orchard drift prediction.

## Factor assessment

[Health Canada guidance](https://www.canada.ca/en/health-canada/services/consumer-product-safety/pesticides-pest-management/growers-commercial-users/drift-mitigation/management-pesticide-spray-drift.html) supports considering wind speed/direction, atmospheric stability, temperature/humidity, nozzle characteristics, pressure, release distance, travel speed and canopy interception. Use it as a scientific reference, not as a substitute for local product requirements.

[Montana State Extension](https://www.montana.edu/extension/pesticides/reference/drift.html) distinguishes liquid spray drift from vapor drift and discusses equipment, product formulation, weather and sensitive sites. Model these as distinct mechanisms rather than adding a generic volatility multiplier to wind speed.

Proposed simplification: flat ground means common ground elevation, not equal tree heights or uniform airflow. Observation height, release height and canopy height remain distinct. Cloud/fog are contextual observations, not substitutes for measured temperature differences. A flat orchard can still have variable canopy density, row orientation and downwind sensitive areas.

## User-selected direction

### Small-data forecasting experiment (2026-11-15)

The user accepted the recommended initial ML target: predict whether an inversion will occur at the same site 30 minutes later. Evaluate an existing pretrained tabular foundation model against a simple baseline; do not pretrain a foundation model from scratch. The user explicitly requests a very small dataset. An exact row budget and model are not yet selected.

The intended data direction includes multiple sites/dates and combining weather sources. Each example belongs to one site and time; additional sources supply identified context, never a fabricated second tower level. Current rule-based GO / CAUTION / STOP screening remains separate from the forecast experiment.

The user subsequently accepted two sites with seven consecutive days each, at 30-minute intervals: at most 672 raw site-interval records before quality filtering and target construction. SRER is the existing local candidate; the second site's coverage remains to be verified.

The target is whether upper mean temperature exceeds lower mean temperature during the next 30-minute interval. For example, inputs available by 10:00 predict the interval 10:00-10:30, not every instantaneous condition within it. This predicts inversion presence, including persistence, rather than onset alone.

Use chronological training, validation and test partitions, with a persistence baseline that predicts the next interval's inversion state equals the current state. Assess missed inversions and false alarms, and separately inspect onset and dissipation. This small experiment does not establish operational spraying reliability.

The user accepted TabPFN as the first pretrained-model candidate, running locally without initial fine-tuning, and a controlled comparison of tower-only inputs against tower inputs plus additional weather context. Exact package/model version, local execution feasibility and source availability still require verification. Tower inputs may include paired temperatures, wind speeds/directions and recent changes; context candidates include humidity and cloud cover. Both variants must use the same evaluation partitions. Context must be available at the prediction cutoff; historical reanalysis must not be silently treated as an archived forecast available at that time.

The user accepted cloud cover as a first-version context feature, subject to the availability check above. Geographic information is used for source-location matching and display, not as model input in this two-site experiment. Fixed site attributes could merely identify the two sites; defer terrain/elevation/land-cover predictors until more sites and evaluation on unseen sites are feasible. Sensor height above ground remains distinct from terrain elevation and is retained as measurement metadata.

The user accepted preserving negative results: if TabPFN does not improve on the baseline, present the baseline; if eligible cloud/context data cannot be verified, complete the tower-only experiment. Forecasts are displayed separately and do not override current rule-based screening.

The user additionally requires type safety and confidence information and accepted typed forecast/result contracts, explicit available/unavailable states, and runtime validation of external data and model output. Missing values, invalid units and invalid probabilities must not appear as normal predictions.

The user accepted separate display of model-estimated inversion probability, reliability status (uncalibrated small-sample experiment initially), and input-data quality. Probability is not a claim of model accuracy. Do not assign high/medium/low reliability labels from model probability alone. If the selected persistence baseline supplies only a binary forecast, do not fabricate a probability or confidence percentage.

The design interview's product choices are resolved. Final shared-understanding confirmation is pending before implementation. Verify the second site's data, time-eligible cloud context, model access/version and local execution as implementation prerequisites. A demo deadline has not been provided. These are experiment decisions, not evidence of validated forecast or drift performance.

The user selected all three output ambitions, starting with explainable weather screening. Quantitative drift/deposition prediction and equipment advice remain later ambitions, not validated capabilities or committed implementation specifications.

Initial application method: orchard airblast sprayer, accepting the recommended starting scope.

Data sequence: historical demonstration first, then real-time use and ML training. Later stages require separate feasibility and validation decisions.

Historical records provide past temperature profiles; they do not cause inversions or establish current orchard conditions. A paired upper-minus-lower temperature difference describes the sampled layer at that historical time. Measurement uncertainty and height/time alignment must be handled before operational interpretation. Rule-trigger replay alone does not independently validate detector accuracy or pesticide drift predictions.

## Historical replay scope confirmed

The user accepted real non-orchard tower observations and a detailed timestamped single-site timeline. Geographic scope is United States-wide, preferring national sources; Arizona is the first test area. Iowa remains a reference only. Preserve source time precision, timezone, measurement/aggregation intervals, and retrieval time; never fabricate fine temporal resolution.

See [US sources and Arizona pilot](us-sources-arizona-pilot.md) for the next source verification pass and remaining access constraints.

No ADR created: these are staged product directions rather than a hard-to-reverse architecture choice. Implementation remains pending completion of the design interview.
