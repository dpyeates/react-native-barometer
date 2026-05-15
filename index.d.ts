import type {BarometerPayload} from './src/NativeRNBarometer';

export type {BarometerPayload};

export const STANDARD_PRESSURE_HPA: number;
export const DEFAULT_INTERVAL_MS: number;
export const MIN_INTERVAL_MS: number;

export interface BarometerModule {
  watch(success: (payload: BarometerPayload) => void): number;
  clearWatch(watchID: number): void;
  stopObserving(): void;
  isSupported(): Promise<boolean>;
  setInterval(interval: number): void;
  setLocalPressure(pressure: number): void;
}

declare const Barometer: BarometerModule;
export default Barometer;
