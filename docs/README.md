# Documentation

SprayWise is the project name; **Spray or Wait?** is the supplied challenge title.

| Location | Purpose |
| --- | --- |
| [Challenge brief](project/challenge.md) | Supplied problem, audience, minimum requirements and stretch goals |
| [Demo guide](guides/demo.md) | Demonstration steps, orchard setup and permissions |
| [Technical reference](technical/weather-screening.md) | Current evaluator rules, validation, storage and limits |
| [Research](research/README.md) | Source feasibility and research ideas, with uncertainty retained |
| [Glossary](../GLOSSARY.md) | Shared domain vocabulary |
| [Design history](../.scratch/spraywise/design-notes.md) | Local design discussion and prior scope decisions |
| [Agent instructions](../AGENTS.md) | Entry point for repository workflow rules |
| [Archived README](archive/README.original.txt) | Original short team README, preserved verbatim |

## Adding material

Keep challenge reference material in `project/`, usage instructions in `guides/`, and implemented behavior in `technical/`. Put investigations in `research/`, naming their sources and separating verified findings from hypotheses. Keep specs and tickets in `.scratch/` according to [issue-tracker conventions](agents/issue-tracker.md). Architectural decisions, when needed, belong in `docs/adr/` under the existing domain instructions.

Research ideas do not become implementation requirements automatically. Update links when moving files; keep the root README as the short project entry point.
