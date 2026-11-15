# Issue tracker: Local Markdown

Issues and specs live in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Spec: `.scratch/<feature-slug>/spec.md`.
- Implementation tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  numbered from `01`, one file per ticket.
- Record triage state in a `Status:` line near the top.
  Use the role strings in `triage-labels.md`.
- Append comments and conversation history under `## Comments`.

## Publishing and fetching

When a skill says "publish to the issue tracker", create the
appropriate spec or ticket file using the paths above.

When a skill says "fetch the relevant ticket", read the referenced
file. Resolve issue numbers within the relevant feature directory.

## Wayfinding operations

Used by `/wayfinder`.

- Map: `.scratch/<effort>/map.md`, containing Notes,
  Decisions-so-far, and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`,
  numbered from `01`, with the question in the body.
- Type: record `research`, `prototype`, `grilling`, or `task`
  in a `Type:` line.
- Blocking: record dependencies in a `Blocked by: NN, NN` line.
  A ticket is unblocked when all listed tickets are resolved.
- Frontier: select the lowest-numbered open, unblocked,
  unclaimed ticket.
- Claim: set `Status: claimed` and save before starting work.
- Resolve: append the answer under `## Answer`, set
  `Status: resolved`, and append a summary and ticket link
  to the map's Decisions-so-far section.

Wayfinding uses `claimed` and `resolved` for execution state;
the triage vocabulary is defined separately in `triage-labels.md`.
