import type {CodegenTypes, TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type BarometerPayload = {
  timestamp: number;
  pressure: number;
  altitudeASL: number;
  altitude: number;
  relativeAltitude: number;
  verticalSpeed: number;
  /** Sensor accuracy: Android SENSOR_STATUS_*; -1 when unknown (e.g. iOS). */
  accuracy: number;
};

export type BarometerErrorPayload = {
  code: string;
  message: string;
};

export interface Spec extends TurboModule {
  readonly onBarometerUpdate: CodegenTypes.EventEmitter<BarometerPayload>;
  readonly onBarometerError: CodegenTypes.EventEmitter<BarometerErrorPayload>;
  isSupported(): Promise<boolean>;
  setInterval(interval: number): void;
  setLocalPressure(pressure: number): void;
  setSmoothing(alpha: number): void;
  setAltitudeReference(metres: number): void;
  resetRelativeAltitude(): void;
  startObserving(): void;
  stopObserving(): void;
}

/**
 * Resolve lazily with soft-fail. Avoid top-level getEnforcing — it breaks
 * AppRegistry when the Turbo Module is missing (mislink, web, some simulators).
 */
export function getNativeRNBarometer(): Spec | null {
  return TurboModuleRegistry.get<Spec>('RNBarometer');
}
