export {default} from './src/barometer';
export {useBarometer} from './src/useBarometer';
export type {
  UseBarometerOptions,
  UseBarometerResult,
} from './src/useBarometer';
export type {BarometerPayload, BarometerError} from './src/NativeRNBarometer';
export type {AuthorizationStatus, BarometerModule} from './src/createBarometer';
export {
  STANDARD_PRESSURE_HPA,
  DEFAULT_INTERVAL_MS,
  MIN_INTERVAL_MS,
  getAltitude,
} from './src/validation';
