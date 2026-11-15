# US sources and Arizona pilot

Verified against official documentation on 2026-11-15. Source feasibility only: no observation files downloaded or field performance validated. A web attempt at NEON site JSON was inaccessible; AZMet's linked example returned JSON content type but no inspectable records through the web reader. Do not claim successful payload validation.

## Recommended source roles

| Source | Role | Evidence and limits |
| --- | --- | --- |
| NEON, national network | Multi-height historical observations | [SRER](https://www.neonscience.org/field-sites/srer) in Pima County, Arizona: 31.91068, -110.83549; 8 m tower, four measurement levels, shrub/scrub. This is not an orchard. Exact colocated sensor heights and overlapping valid intervals remain unverified. |
| NOAA NCEI GHCNh | National historical surface-weather context | [Official product](https://www.ncei.noaa.gov/products/global-historical-climatology-network-hourly) replaces ISD; hourly/synoptic observations, QC information, PSV/parquet bulk access. Does not establish a same-site near-ground temperature profile. |
| NOAA NWS API | National recent weather and forecasts | [Documentation](https://www.weather.gov/documentation/services-web-api): station observations retain seven days. Not the long-term archive or a verified multi-height inversion source. |
| AZMet | Arizona agricultural context | [Bowie az33](https://azmet.arizona.edu/about/station-metadata/az33): beside orchards; air temperature/RH at 1.5 m, wind at 3 m. These are different variables, not two temperatures for inversion detection. |

## NEON API route

Base: https://data.neonscience.org/api/v0

```text
GET /sites/SRER
GET /products/DP1.00002.001
GET /products/DP1.00001.001
GET /data/DP1.00002.001/SRER/{YYYY-MM}
GET /data/DP1.00001.001/SRER/{YYYY-MM}
```

The temperature product is single-aspirated air temperature; the wind product is 2D wind. Inspect monthly availability, sensor-position metadata, actual heights, interval fields, uncertainty and flags before selecting a day. Never infer exact sensor heights from total tower height or level codes. Check wind coverage independently from temperature coverage.

The [wind quick-start guide](https://data.neonscience.org/api/v0/documents/quick-start-guides/NEON.QSG.DP1.00001.001v1?fallback=html&inline=true) documents 2- and 30-minute wind averages, excluding the tower top. Associate HOR.VER with sensor_positions zOffset; retain windSpeedFinalQF and windDirFinalQF. The [temperature tutorial](https://www.neonscience.org/resources/learning-hub/tutorials/neon-saat-temp-r) documents 1- and 30-minute temperature averages with startDateTime/endDateTime. Thus a first joint replay can use matching 30-minute intervals, while temperature-only inspection may retain 1-minute resolution. This is product-level documentation, not confirmation of SRER file completeness. [NEON time conventions](https://www.neonscience.org/data-samples/data-management/data-formats-conventions) use ISO 8601 UTC.

[Authentication documentation](https://data.neonscience.org/data-api/authentication/) permits unauthenticated metadata exploration but requires an account API token for data downloads. [Data endpoint documentation](https://data.neonscience.org/data-api/endpoints/data/) specifies product/site/month file listings and authentication. Use the X-API-Token header via local configuration, not committed code or frontend assets. A credential has not been provided or requested in chat text.

## AZMet endpoint and timestamp caveats

[2026 API documentation](https://extension.arizona.edu/publication/programmatic-access-azmet-data-web-api) defines:

```text
https://api.azmet.arizona.edu/v1/observations/hourly/az33/{YYYY-MM-DDTHH:MM}/PT24H
https://api.azmet.arizona.edu/v1/observations/15min/az33/*/*
```

These are documented request patterns, not tested successful downloads here. Hourly archives extend from 2020 for stations with data; 15-minute records are retained only for the past 14 days. Most 15-minute fields are instantaneous, not 15-minute averages. Hourly fields mostly aggregate over the hour. Source inputs use Arizona local time without an offset; hourly midnight is represented as 23:59:59. Preserve the raw timestamp and normalize with documented semantics, rather than treating this convention as one-second sampling.

## Replay record requirements

- Original source timestamp and timezone semantics.
- Normalized UTC time and station-local display time; use America/Phoenix for SRER/Bowie, not a fixed zone for all US sites.
- Interval start/end where supplied, sampling/aggregation duration, and statistic type.
- Station, product, sensor identifier and physical height above ground.
- Value, unit, source quality flags and uncertainty when available.
- Retrieval time, source URL, release/version and raw file checksum after download.
- Playback clock separate from current time. Missing pairs stay unavailable; do not synthesize an upper temperature from another station or interpolate gaps as observations.

## Next gate

Obtain authorized NEON account access locally, select a month shared by both products, download the smallest useful sample with metadata, then determine actual record spacing and select a continuous event. No exact event date, observed inversion or one-minute cadence is claimed until this check succeeds. If download access is unavailable, AZMet can test weather-context timestamps but cannot replace the promised multi-height test.
