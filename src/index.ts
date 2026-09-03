export {default} from './barometer';
export {
  STANDARD_PRESSURE_HPA,
  DEFAULT_INTERVAL_MS,
  MIN_INTERVAL_MS,
  DEFAULT_SMOOTHING,
} from './barometer';
export type {
  BarometerPayload,
  BarometerErrorPayload,
  BarometerWatchCallback,
  BarometerErrorCallback,
} from './barometer';
export {useBarometer} from './useBarometer';
export type {UseBarometerOptions, UseBarometerResult} from './useBarometer';
export {
  getAltitude,
  pressureFromAltitude,
  clampInterval,
  validatePressure,
  clampSmoothing,
  MIN_SMOOTHING,
  MAX_SMOOTHING,
} from './validation';
