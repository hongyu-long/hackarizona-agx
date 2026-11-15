# SprayWise design interview

These notes record the interview and the subsequently approved MVP scope.

## Confirmed decisions

- Analyze current conditions from multi-height observations; do not train a model for the first version.
- Present wind speed and direction at each observed height and their changes over time; do not present a reconstructed full wind field or drift trajectory.
- Include basic scenario switching in P0.
- Risk classification remains configurable. The user approved the proposed MVP and then asked to continue after the five submission requirements and proposed demonstration thresholds were restated.
- Do not pursue team size or schedule questions at the user's request.

## Proposed factors, awaiting clarification

- User assumption: "even orchard"; whether this means flat terrain, uniform canopy, or both is unresolved.
- Observation height, wind speed at each height, temperature at each height.
- Cloud/overcast conditions and fog.
- Geographic features; scope and role in analysis remain unresolved.

## Source

- User-supplied challenge brief and conversation.
- `C:/Users/ririka/Downloads/SprayWise_PRD.docx` is a proposed baseline, not blanket-approved requirements.

## Approved MVP and implementation bounds

- Single-page React/TypeScript app; simulated 5 ft / 30 ft observations, deterministic analysis, four scenarios and persistent browser-local logs.
- Flat terrain is the explicit demo assumption; no geographic analysis, cloud/fog model or ML training.
- Inversion and wind outside 3–10 mph trigger STOP; configurable shear bands default to 4/7 mph and 45/90 degrees for CAUTION/STOP. These bands are demonstration choices.
- Invalid required input produces UNAVAILABLE. This MVP validates the pair before risk analysis and does not retain partial weather alerts from invalid pairs.
- Observations are explicitly fixed simulated snapshots; reassessing generates a new timestamped event. No live monitoring is implied.
- Store up to 1,000 records without silent eviction. Offer JSON export, explicit clearing and visible unsaved state on write failure.

## Follow-up: map and first-use onboarding (design in progress)

- User wants an actual street/satellite basemap, rather than an orchard illustration. Basemap selection is not yet settled.
- Investigate existing real weather towers: location, measured heights, available variables and access permissions. Research is separate from permission to connect any particular source.
- On first use, explain the purpose of location and notification access and offer permission requests.
- User approved: orchard name and confirmed location; optional crop, average tree height and boundary; skippable location/notification prompts; local-only storage with edit/clear/export and a future database planned.
- Do not reopen scheduling or development-order questions in this interview.

Implemented first-use flow: explanation before permission buttons, street map with explicit tile-provider disclosure, manual coordinates, optional boundary drawing, separate notification step, local profile persistence and export. Notifications only cover simulated status changes while the page is open. Satellite imagery, geocoding search, real tower connection and backend storage remain unimplemented. Source feasibility is recorded in `docs/research/weather-tower-data.md`.
