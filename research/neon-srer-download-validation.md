# SRER real-data verification

Authenticated NEON downloads succeeded on 2026-11-15 for June 2024 at SRER, Arizona. Data directory: `data/neon-srer-2024-06/`. No application integration was performed.

## Source and integrity

National Ecological Observatory Network (NEON): Single aspirated air temperature DP1.00002.001 and 2D wind speed and direction DP1.00001.001. [Station](https://www.neonscience.org/field-sites/srer), [API](https://data.neonscience.org/data-api/endpoints/data/).

Twelve files were downloaded: three 30-minute series per product plus readme, variables and sensor-position metadata for each product. Expected byte sizes and local SHA-256 values were checked against manifest.json. Each of six observation series has 1,440 records, all spanning 30 minutes. Lower/upper temperature timestamps align. Scientific quality flags must still be checked for every event used.

The manifest contains retrieval timestamps, source endpoints and hashes; no token or signed download URL. The credential was used only in request memory, not written to project files. Retain NEON attribution, CC BY 4.0 licensing and downloaded readme citation guidance when redistributing data.

## Sensor positions

| Level | Temperature zOffset (m) | Wind zOffset (m) |
| --- | --- | --- |
| 000.010 | 0.25 | 0.23 |
| 000.020 | 1.64 | 1.62 |
| 000.030 | 3.90 | 3.87 |

These are source sensor-position offsets relative to the tower reference. Preserve the differing positions and metadata; do not substitute simulated 5 ft/30 ft heights. SRER is shrubland, not an orchard.

## Verified positive-temperature-gradient example

- UTC: 2024-06-01T12:30:00Z to 2024-06-01T13:00:00Z.
- America/Phoenix: 2024-06-01T05:30:00-07:00 to 2024-06-01T06:00:00-07:00.
- Lower level mean: 17.1199 C; upper level mean: 20.1022 C.
- Upper minus lower: +2.9823 C.
- Both temperature finalQF values: 0.
- Machine-readable values: data/neon-srer-2024-06/verified-example.json.

This is a real measured mean temperature increase between sampled levels, not validation of pesticide drift distance or an operational spray recommendation. These are interval averages, not instantaneous samples.

## Remaining work

One initial one-minute file download was interrupted and renamed `.csv.partial`; it is excluded from all analysis and the verified manifest. Complete minute-resolution download remains pending. A continuous event and the corresponding wind quality flags must be assessed before UI replay integration.

Earlier research Markdown files were absent from the workspace at the final check; this standalone report records only this session's verified download results without restoring missing documents.
