# Real weather tower sources for To Spray or Not to Spray

Checked 2026-11-15 against official sources. This is source feasibility research, not a connected sensor feed or a verified field deployment.

## Findings

| Source | Multi-height capability | Access and fit |
| --- | --- | --- |
| NEON terrestrial towers | Official products describe wind speed/direction at multiple tower heights and single-aspirated temperature profiles. | Best candidate for historical replay using genuine multi-height observations. Downloads require account/API token; data are not a live orchard feed. |
| UCCE San Luis Obispo network | Temperature at 5 ft and 30 ft; public dashboard also lists wind. | Relevant agricultural inversion example, but the reviewed material does not establish wind at two heights. API permission and redistribution terms are not confirmed. |
| CIMIS | Standard wind sensor height 2 m; temperature 1.5 m. | Useful regional context, but different heights for different variables are not paired temperature AND wind profiles. Weather API requires an AppKey. |

### NEON: recommended historical-data candidate

The official [2D wind product DP1.00001.001](https://data.neonscience.org/data-products/DP1.00001.001) describes multiple wind sensor levels on terrestrial towers. The [NEON tutorial](https://www.neonscience.org/resources/learning-hub/tutorials/get-started-neon-data-series-data-tutorials) describes multiple levels of single-aspirated temperature; use the [temperature product DP1.00002.001](https://data.neonscience.org/data-products/DP1.00002.001) rather than assuming a tower-top temperature represents every level.

A concrete California candidate is **SJER, San Joaquin Experimental Range**, Madera County. Its official site coordinates are **37.10878, -119.73228 (WGS84)**; its tower is **39 m tall with six measurement levels**. These are site coordinates and total tower height, not six verified sensor heights. The site is forest/grassland/shrub habitat, not a commercial orchard. [Official SJER site](https://www.neonscience.org/field-sites/sjer).

Exact temperature/wind sensor elevations, colocated levels, quality flags and overlapping time intervals must be checked in the selected month's sensor-position metadata before constructing pairs. A level code is not a height in meters. [File conventions](https://www.neonscience.org/data-samples/data-management/data-formats-conventions), [wind quick-start guide](https://data.neonscience.org/api/v0/documents/quick-start-guides/NEON.QSG.DP1.00001.001v1?fallback=html&inline=true).

Instrument data are generally published the following month, so use an explicit historical replay clock, not today's timestamp. [Data latency](https://www.neonscience.org/data-samples/data-management/data-availability). Metadata exploration does not require authentication, but downloads now require an account/token. Do not put a token in frontend code or Git. [Authentication](https://data.neonscience.org/data-api/authentication/). Current data policy is **CC BY 4.0**, requiring attribution. [Usage policy](https://www.neonscience.org/usage-policies).

No authenticated data download was attempted; no exact paired sensor heights or monthly record completeness is claimed here.

### UCCE San Luis Obispo: inversion reference

The university describes a 30-ft tower and computes inversion as temperature at 30 ft minus temperature at 5 ft. [UCCE station network](https://ucanr.edu/county/county-san-luis-obispo/ucce-weather-station-network). The linked [public dashboard](https://ucce-slo.westernweathergroup.com/) exposes both temperature fields and wind-speed fields, but not an established two-height wind pair in the reviewed table. Do not invent a second wind reading or scrape a production integration before confirming access terms and sensor metadata with the operator.

### CIMIS: regional context only

[Official sensor heights](https://cimis-proxy.water.ca.gov/Stations.aspx?t=4) place wind at 2 m and temperature/humidity at 1.5 m. This does not satisfy two-height temperature and wind screening. [API FAQ](https://et.water.ca.gov/Home/Faq) says station information is accessible without registration, whereas weather data requests require an AppKey. It may help locate regional stations, but cannot replace orchard tower measurements.

## Recommendation for this MVP

Keep map location, user orchard metadata and simulated readings explicitly separate. Add a vetted NEON historical replay later after a specific authenticated download is checked. Never relabel the nearest public station as the user's orchard observation. The first-use map currently shows a user-selected orchard point, not a discovered real tower.
