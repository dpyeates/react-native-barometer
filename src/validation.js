'use strict';

const STANDARD_PRESSURE_HPA = 1013.25;
const MIN_INTERVAL_MS = 50;
const DEFAULT_INTERVAL_MS = 200;

function clampInterval(interval) {
  const ms = Number(interval);
  if (!Number.isFinite(ms) || ms < MIN_INTERVAL_MS) {
    return MIN_INTERVAL_MS;
  }
  return Math.floor(ms);
}

function validatePressure(pressure) {
  const hPa = Number(pressure);
  if (!Number.isFinite(hPa) || hPa <= 0) {
    return STANDARD_PRESSURE_HPA;
  }
  return hPa;
}

/** Barometric altitude in metres from sea-level pressure p0 (hPa) and station pressure p (hPa). */
function getAltitude(p0, p) {
  const coef = 1.0 / 5.255;
  return 44330.0 * (1.0 - Math.pow(p / p0, coef));
}

module.exports = {
  STANDARD_PRESSURE_HPA,
  MIN_INTERVAL_MS,
  DEFAULT_INTERVAL_MS,
  clampInterval,
  validatePressure,
  getAltitude,
};
