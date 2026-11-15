import type { Provenance } from './experiment';
const lower = { temperatureC: 10, temperatureQf: 0, windSpeedMps: 2, windSpeedQf: 0, windDirectionDeg: 90, windDirectionQf: 0 };
const upper = { ...lower, temperatureC: 12 };
export const provenance: Provenance = { attribution: 'Synthetic test only', license: 'test', ecosystem: 'test', temperatureHeightsM: [1, 4], windHeightsM: [1, 4], units: 'C,m/s,degrees', inputs: [
  { start: '2024-06-01T09:00:00Z', end: '2024-06-01T09:30:00Z', lower, upper },
  { start: '2024-06-01T09:30:00Z', end: '2024-06-01T10:00:00Z', lower, upper }
] };
