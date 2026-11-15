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

The user selected all three output ambitions, starting with explainable weather screening. Quantitative drift/deposition prediction and equipment advice remain later ambitions, not validated capabilities or committed implementation specifications.

Initial application method: orchard airblast sprayer, accepting the recommended starting scope.

Data sequence: historical demonstration first, then real-time use and ML training. Later stages require separate feasibility and validation decisions.

Historical records provide past temperature profiles; they do not cause inversions or establish current orchard conditions. A paired upper-minus-lower temperature difference describes the sampled layer at that historical time. Measurement uncertainty and height/time alignment must be handled before operational interpretation. Rule-trigger replay alone does not independently validate detector accuracy or pesticide drift predictions.

## Historical replay scope confirmed

The user accepted real non-orchard tower observations and a detailed timestamped single-site timeline. Geographic scope is United States-wide, preferring national sources; Arizona is the first test area. Iowa remains a reference only. Preserve source time precision, timezone, measurement/aggregation intervals, and retrieval time; never fabricate fine temporal resolution.

See [US sources and Arizona pilot](us-sources-arizona-pilot.md) for the next source verification pass and remaining access constraints.

No ADR created: these are staged product directions rather than a hard-to-reverse architecture choice. Implementation remains pending completion of the design interview.
