# Spray or Wait?

**Using weather intelligence to prevent pesticide drift in orchards**

Source: challenge text supplied by the user. This is an organized reference to that text, not an independently verified publication. SprayWise is the team's implementation name.

## Problem and audience

Pesticide drift can reach neighboring crops, workers, communities and the environment. Ground-level impressions and regional forecasts may miss conditions inside an orchard or above its trees.

The brief highlights temperature inversions: cooler air below warmer air suppresses upward mixing, allowing airborne pesticide to remain near the ground and move laterally. Calm ground-level conditions can coexist with stronger or differently directed winds above the canopy.

Build decision support for pesticide applicators and Pest Control Advisers (PCAs) in commercial tree orchards, including California's Central Valley. Explain whether current measured conditions raise spray concerns and why.

## Minimum submission requirements

| Requirement from the brief | Current implementation reference |
| --- | --- |
| Read temperature and wind at at least two heights; approximately 5 ft and 30 ft are examples; simulated data is acceptable | [Scenario fixtures](../../src/data/scenarios.json) |
| Flag an inversion when the upper temperature exceeds the lower temperature | [Risk evaluator](../../src/features/weather/risk.ts) |
| Flag wind below 3 mph or above 10 mph; actual limits depend on the pesticide label | Risk evaluator; configured demo defaults |
| Flag large differences in wind speed or direction between heights | Risk evaluator; the challenge does not prescribe numeric shear thresholds |
| Give a clear status, such as Go, Caution or Stop, with plain-language reasons | [Dashboard](../../src/main.tsx); also supports UNAVAILABLE for invalid inputs |
| Keep timestamped readings and the triggers behind each alert | [Observation storage](../../src/features/weather/storage.ts) and dashboard evidence view |

For exact implemented thresholds and limits, see [weather screening](../technical/weather-screening.md). These references describe implementation coverage, not field validation.

## Stretch goals from the brief

- Account for pesticide properties, such as volatility, or application details.
- Use National Weather Service forecasts or historical data to estimate future spray windows or warn of worsening conditions.
- Monitor during and after spraying.
- Send text or push alerts.
- Build a physical sensor prototype.

The brief permits simulated data and public weather data. Current notifications are in-page-session status notifications; they are not a background push service. Other research directions are indexed in [research](../research/README.md).

## Additional team ideas

Site-specific farmer records, terrain/shading data and wind-machine analysis were supplied separately as exploratory ideas. They are not minimum submission requirements. See [inversion and wind-machine notes](../research/inversion-and-wind-machines.md).
