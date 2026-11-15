# SprayWise design interview

These notes record the ongoing interview, not an approved implementation spec.

## Confirmed decisions

- Analyze current conditions from multi-height observations; do not train a model for the first version.
- Present wind speed and direction at each observed height and their changes over time; do not present a reconstructed full wind field or drift trajectory.
- Include basic scenario switching in P0.
- Leave risk classification open to revision; no final status mapping, thresholds, or scoring formula has been approved in the interview.
- Do not pursue team size or schedule questions at the user's request.

## Proposed factors, awaiting clarification

- User assumption: "even orchard"; whether this means flat terrain, uniform canopy, or both is unresolved.
- Observation height, wind speed at each height, temperature at each height.
- Cloud/overcast conditions and fog.
- Geographic features; scope and role in analysis remain unresolved.

## Source

- User-supplied challenge brief and conversation.
- `C:/Users/ririka/Downloads/SprayWise_PRD.docx` is a proposed baseline, not blanket-approved requirements.
