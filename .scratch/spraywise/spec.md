# Arizona historical weather replay and local virtual database

Status: ready-for-agent

## Problem Statement

Applicators and reviewers need to inspect weather readings at more than one height and understand what triggered a weather status. The current experience relies on simulated snapshots and cannot replay real historical observations through a local queryable archive.

## Solution

Add a local virtual database and historical replay for verified NEON SRER data from Arizona. Users can select a site and time, inspect temperature and wind at the lowest and highest available measurement levels, see a plain-language GO, CAUTION, STOP, or UNAVAILABLE result, and save an auditable log entry. The virtual database runs on the user's device and requires no hosted database service or NEON credential at runtime.

## User Stories

1. As an applicator, I want to choose an available historical site so that I know which station the readings describe.
2. As an applicator, I want to browse the Arizona SRER historical dataset so that I can explore real multi-height observations.
3. As an applicator, I want the UI to clearly identify SRER as shrubland rather than an orchard so that I do not mistake the demonstration site for orchard validation.
4. As an applicator, I want to choose a date and time within available records so that I can inspect a past weather profile.
5. As an applicator, I want to step or scrub through the historical timeline so that I can see how conditions changed.
6. As an applicator, I want the selected location's local time displayed by default so that the timeline is intuitive for that site.
7. As an applicator, I want to switch displayed times between local time and UTC so that I can compare the UI with source records.
8. As an applicator, I want the observation interval's start and end shown so that I understand whether a value is instantaneous or averaged.
9. As an applicator, I want the original observation heights shown in meters and feet above local ground so that I understand what the sensors measured.
10. As an applicator, I want temperature at the lowest and highest available levels so that I can compare the sampled air layers.
11. As an applicator, I want wind speed and direction at both selected levels so that I can compare observed conditions at those heights.
12. As an applicator, I want the system to flag an inversion when the upper temperature is greater than the lower temperature so that the reason for a STOP is clear.
13. As an applicator, I want wind below 3 mph or above 10 mph flagged at either selected height so that I can review common wind guidance.
14. As an applicator, I want configurable wind speed and direction shear bands so that I can see substantial differences between heights.
15. As an applicator, I want shear thresholds identified as demonstration settings rather than universal safety limits so that I do not treat them as pesticide-label instructions.
16. As an applicator, I want GO, CAUTION, STOP, or UNAVAILABLE with plain-language reasons so that I can understand the assessment.
17. As an applicator, I want missing, invalid, misaligned, or quality-flagged readings to be visible and prevent a favorable status so that gaps are not mistaken for safe conditions.
18. As an applicator, I want the lowest and highest available levels used as the comparison pair so that the rule remains consistent when a dataset has more than two levels.
19. As an applicator, I want a log entry to include the selected readings, actual heights, source interval, rule settings, result, and every triggered reason so that I can review the evidence later.
20. As an applicator, I want each entry to store the evaluation time separately from the weather observation interval so that replayed history is not confused with current time.
21. As an applicator, I want evaluation and observation times to follow the selected local/UTC display preference so that log chronology remains legible.
22. As an applicator, I want records saved locally and preserved across reloads so that the virtual database remains useful without an online database.
23. As an applicator, I want to export local records so that I can retain and share my assessment history.
24. As an applicator, I want simulated scenarios to remain available and explicitly labeled so that I can explore edge cases when real data has gaps.
25. As an applicator, I want historical replay clearly labeled as historical so that it cannot be mistaken for a live monitoring feed.

## Implementation Decisions

- Use the existing single-page React/TypeScript application and its weather assessment and local evidence concepts.
- Add a device-local virtual database for querying imported historical observations by site, date/time interval, and observation height. No hosted database, account system, or runtime NEON authentication is part of this feature.
- Seed the Arizona test catalog with the verified NEON SRER June 2024 30-minute temperature and wind observations plus their variable and sensor-position metadata. Include only complete, validated source files; exclude partial downloads.
- Preserve NEON source timestamps in UTC and their interval boundaries. Show the selected site's local time by default and provide a UTC display toggle. Store the evaluation timestamp separately.
- Select the lowest and highest available levels for the inversion comparison. Display actual sensor positions; convert units for presentation without overwriting source units or values.
- Use the existing risk rules: upper temperature greater than lower means inversion; wind below 3 mph or above 10 mph flags; configurable speed shear defaults of 4 mph CAUTION / 7 mph STOP and direction shear defaults of 45 degrees CAUTION / 90 degrees STOP. Label shear values as demonstration settings, not universal limits. Product labels and on-site conditions remain authoritative.
- Retain the existing local log and export behavior, extending the evidence record to represent historical source, observation interval, evaluation timestamp, timezone display preference, site, levels, quality flags, and rule configuration.
- Keep missing/invalid/unusable selected readings UNAVAILABLE; do not fabricate measurements or silently interpolate gaps.
- Do not expose NEON credentials in frontend code. Runtime replay uses the bundled/locally stored dataset only.
- Preserve the dataset attribution and CC BY 4.0 terms with the local data catalog and any exported source data.

## Testing Decisions

- Primary confirmed seam: test the user-visible historical replay flow with a representative real-data fixture. Cover dataset loading, site/time selection, local/UTC display, readings at actual heights, status/reasons, and the saved evidence record containing observation interval and evaluation time.
- Test through the highest practical user-facing seam; avoid assertions coupled to private component state or internal helper structure.
- Keep the existing risk evaluator tests as prior art for inversion, wind bounds, shear, unavailable readings, and status priority.
- Keep the existing evidence-storage tests as prior art for persistence, exportable evidence shape, corrupted storage, and storage failures.
- Verify the bundled data catalog has valid source metadata, monotonic/nonduplicated intervals, expected measurement heights, and no partial files.

## Out of Scope

- Cloud/fog, humidity, terrain or geographic risk models, orchard canopy modeling, pesticide volatility, spray drift distance/deposition predictions, or machine setting recommendations.
- Machine learning, forecasts, live monitoring, automatic remote API polling, or production deployment.
- A hosted database, cross-device synchronization, authentication for SprayWise users, or user-supplied NEON API tokens.
- Treating SRER as an orchard or claiming that this historical sample validates orchard spray safety.
- Removing simulated scenarios; they remain a labeled fallback and demonstration path.

## Further Notes

- The design interview explicitly selected these five challenge requirements as the first-version scope: multi-height temperature and wind, inversion detection, wind checks, configurable between-height differences, clear status/reasons, and a timestamped evidence log.
- Verified source sample and exact event details are documented in the accompanying Arizona NEON validation report. The initial sample contains 30-minute averages and three matched sensor levels. One incomplete 1-minute file is excluded.
- This is decision support, not authorization to spray. GO means only that configured weather rules did not trigger.
