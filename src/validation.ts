export const STANDARD_PRESSURE_HPA = 1013.25;
export const MIN_INTERVAL_MS = 50;
export const DEFAULT_INTERVAL_MS = 200;

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

/** Barometric altitude in metres from sea-level pressure p0 (hPa) and station pressure p (hPa). */
export function getAltitude(p0: number, p: number): number {
  const coef = 1.0 / 5.255;
  return 44330.0 * (1.0 - Math.pow(p / p0, coef));
}

export function isFatalBarometerError(code: string): boolean {
  return (
    code === 'no_sensor' ||
    code === 'unauthorized' ||
    code === 'altimeter_error'
  );
}
