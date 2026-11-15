# SprayWise

Weather decision support for orchard pesticide applicators, built for HackArizona-AGx 2026's **Spray or Wait?** challenge.

The React/TypeScript demo screens simulated temperature and wind at 5 ft and 30 ft, explains GO / CAUTION / STOP / UNAVAILABLE results, and keeps timestamped browser-local records. Optional orchard setup includes a street map.

## Run

Requires Node.js 22.12+ (tested with Node 26). On Windows PowerShell use `npm.cmd` if script execution policy blocks `npm`.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm test` for evaluator/storage tests and `npm run build` for type checking and a production build. `npm run preview` serves the production build.

## Documentation

- [Documentation index](docs/README.md) ? where to find and add information.
- [Challenge brief](docs/project/challenge.md) ? audience, requirements and stretch goals.
- [Demo and setup](docs/guides/demo.md) ? presentation walkthrough and browser features.
- [Weather rules and storage](docs/technical/weather-screening.md) ? implemented behavior and limitations.
- [Research index](docs/research/README.md) ? data sources, inversion notes and future ideas.

## Repository layout

```text
src/
  main.tsx                App entry point and dashboard
  features/
    weather/              Risk evaluation, logs and colocated tests
    orchard/              Setup, map, profile storage and colocated tests
  data/                   Simulated scenario fixtures
  styles/                 Dashboard and onboarding CSS
docs/
  project/                Challenge reference
  guides/                 Demo and app usage
  technical/              Implemented behavior and limits
  research/               Source investigations and research notes
  agents/                 Contributor/agent workflow instructions
  archive/                Preserved legacy material
.scratch/                 Local design discussions, specs and tickets
GLOSSARY.md               Shared domain vocabulary
```

`node_modules/` and `dist/` are generated and ignored by Git. Keep demo fixtures in `src/data/`; do not commit credentials or local configuration.

## Scope

GO means no configured weather flags, not authorization to spray or zero drift risk. Follow pesticide labels and applicable requirements. Real sensor ingestion, historical replay, forecasting, drift prediction and wind-machine recommendations are not implemented. See the [technical notes](docs/technical/weather-screening.md) for exact behavior and [design history](.scratch/spraywise/design-notes.md) for prior decisions.
