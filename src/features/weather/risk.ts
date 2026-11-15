export type Status = 'GO' | 'CAUTION' | 'STOP' | 'UNAVAILABLE';
export type Reading = { id: string; site: string; heightFt: number; temperatureC: number | null; speedMph: number | null; directionDeg: number | null; observedAt: string };
export type Pair = { lower: Reading; upper: Reading };
export type Config = { version: string; minWind: number; maxWind: number; speedCaution: number; speedStop: number; directionCaution: number; directionStop: number; maxAgeSeconds: number; maxSkewSeconds: number };
export const defaults: Config = { version: 'demo-1', minWind: 3, maxWind: 10, speedCaution: 4, speedStop: 7, directionCaution: 45, directionStop: 90, maxAgeSeconds: 120, maxSkewSeconds: 60 };
export type Alert = { code: string; severity: 'CAUTION' | 'STOP'; reason: string };
export type Result = { status: Status; alerts: Alert[]; errors: string[]; deltaTemperature: number | null; deltaSpeed: number | null; deltaDirection: number | null };
export const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
export function angularDifference(a: number, b: number) { const d = Math.abs((a % 360) - (b % 360)); return Math.min(d, 360 - d); }
export function validConfig(c: Config) {
  return Object.values(c).filter(v => typeof v !== 'string').every(v => finite(v) && v >= 0) &&
    c.minWind < c.maxWind && c.speedCaution < c.speedStop && c.directionCaution < c.directionStop && c.directionStop <= 180 && c.maxAgeSeconds > 0;
}
export function evaluateRisk(pair: Pair, config: Config, referenceTime: number): Result {
  const result: Result = { status: 'GO', alerts: [], errors: [], deltaTemperature: null, deltaSpeed: null, deltaDirection: null };
  const { lower, upper } = pair;
  if (!validConfig(config) || !finite(referenceTime)) return { ...result, status: 'UNAVAILABLE', errors: ['Invalid rule configuration or reference time.'] };
  const validDirection = (n: unknown): n is number => finite(n) && n >= 0 && n <= 360;
  for (const [label, r] of [['Lower', lower], ['Upper', upper]] as const) {
    if (!finite(r.temperatureC)) result.errors.push(`${label} temperature is missing or invalid.`);
    if (!finite(r.speedMph) || r.speedMph < 0) result.errors.push(`${label} wind speed is missing or invalid.`);
    if (finite(r.speedMph) && r.speedMph >= config.minWind && !validDirection(r.directionDeg)) result.errors.push(`${label} wind direction is missing or invalid.`);
    if (!finite(r.heightFt) || r.heightFt <= 0) result.errors.push(`${label} sensor height is invalid.`);
    const time = Date.parse(r.observedAt);
    if (!finite(time) || referenceTime - time > config.maxAgeSeconds * 1000 || time - referenceTime > 5000) result.errors.push(`${label} observation is stale or has an invalid timestamp.`);
  }
  if (!lower.site || lower.site !== upper.site || !lower.id || !upper.id || lower.id === upper.id || lower.heightFt >= upper.heightFt) result.errors.push('Sensors must be distinct, ordered by height, and at the same site.');
  if (Math.abs(Date.parse(lower.observedAt) - Date.parse(upper.observedAt)) > config.maxSkewSeconds * 1000) result.errors.push('Observation times are too far apart.');
  // Invalid pairs cannot support a current decision or a cross-height comparison.
  if (result.errors.length) return { ...result, status: 'UNAVAILABLE' };
  const lowT = lower.temperatureC!, highT = upper.temperatureC!, lowS = lower.speedMph!, highS = upper.speedMph!;
  result.deltaTemperature = highT - lowT;
  result.deltaSpeed = Math.abs(highS - lowS);
  const add = (code: string, severity: Alert['severity'], reason: string) => result.alerts.push({ code, severity, reason });
  if (result.deltaTemperature > 0) add('INVERSION', 'STOP', `Upper air is ${result.deltaTemperature.toFixed(1)}°C warmer than lower air. A temperature inversion is detected.`);
  for (const [label, speed] of [['Lower', lowS], ['Upper', highS]] as const) {
    if (speed < config.minWind) add(`${label.toUpperCase()}_LOW_WIND`, 'STOP', `${label} wind is ${speed} mph, below the ${config.minWind} mph reference minimum.`);
    if (speed > config.maxWind) add(`${label.toUpperCase()}_HIGH_WIND`, 'STOP', `${label} wind is ${speed} mph, above the ${config.maxWind} mph reference maximum.`);
  }
  if (result.deltaSpeed >= config.speedCaution) add('SPEED_SHEAR', result.deltaSpeed >= config.speedStop ? 'STOP' : 'CAUTION', `Wind speed differs by ${result.deltaSpeed.toFixed(1)} mph between heights.`);
  if (lowS >= config.minWind && highS >= config.minWind && validDirection(lower.directionDeg) && validDirection(upper.directionDeg)) {
    result.deltaDirection = angularDifference(lower.directionDeg, upper.directionDeg);
    if (result.deltaDirection >= config.directionCaution) add('DIRECTION_SHEAR', result.deltaDirection >= config.directionStop ? 'STOP' : 'CAUTION', `Wind direction differs by ${result.deltaDirection.toFixed(0)}° between heights.`);
  }
  result.status = result.alerts.some(a => a.severity === 'STOP') ? 'STOP' : result.alerts.length ? 'CAUTION' : 'GO';
  return result;
}
