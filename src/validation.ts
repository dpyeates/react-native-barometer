export const STANDARD_PRESSURE_HPA = 1013.25;
export const MIN_INTERVAL_MS = 50;
export const DEFAULT_INTERVAL_MS = 200;
export const DEFAULT_SMOOTHING = 0.3;
export const MIN_SMOOTHING = 0.01;
export const MAX_SMOOTHING = 1;

export function clampInterval(interval: number): number {
  const ms = Number(interval);
  if (!Number.isFinite(ms) || ms < MIN_INTERVAL_MS) {
    return MIN_INTERVAL_MS;
  }
  return Math.floor(ms);
}

export function validatePressure(pressure: number): number {
  const hPa = Number(pressure);
  if (!Number.isFinite(hPa) || hPa <= 0) {
    return STANDARD_PRESSURE_HPA;
  }
  return hPa;
}

export function clampSmoothing(alpha: number): number {
  const value = Number(alpha);
  if (!Number.isFinite(value)) {
    return DEFAULT_SMOOTHING;
  }
  if (value < MIN_SMOOTHING) {
    return MIN_SMOOTHING;
  }
  if (value > MAX_SMOOTHING) {
    return MAX_SMOOTHING;
  }
  return value;
}

/**
 * Barometric altitude in metres from sea-level pressure p0 (hPa) and station
 * pressure p (hPa), using the international standard atmosphere approximation.
 */
export function getAltitude(p0: number, p: number): number {
  const coef = 1.0 / 5.255;
  return 44330.0 * (1.0 - Math.pow(p / p0, coef));
}

/**
 * Sea-level pressure (hPa) that yields `altitudeMetres` for station pressure `p`.
 */
export function pressureFromAltitude(altitudeMetres: number, p: number): number {
  const h = Number(altitudeMetres);
  const pressure = Number(p);
  if (!Number.isFinite(h) || !Number.isFinite(pressure) || pressure <= 0) {
    return STANDARD_PRESSURE_HPA;
  }
  const ratio = 1.0 - h / 44330.0;
  if (ratio <= 0) {
    return STANDARD_PRESSURE_HPA;
  }
  return pressure / Math.pow(ratio, 5.255);
}
