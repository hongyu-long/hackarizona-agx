# Domain docs

## Layout and reading rules

This repo uses a single-context layout:

- `GLOSSARY.md` at the repo root contains domain vocabulary.
- `docs/adr/` contains architectural decision records.

Before exploring the codebase, read the glossary and ADRs
relevant to the area being investigated.

If these files do not exist, proceed silently. The
`domain-modeling` skill creates them when terms or decisions
are resolved.

## Vocabulary

Use the glossary's defined terms in issue titles, proposals,
hypotheses, and test names.

If a concept is missing, reconsider whether it fits the project
or note the gap for `domain-modeling`.

## ADR conflicts

Explicitly identify proposals that contradict an existing ADR,
including the ADR reference and the reason to revisit it.
