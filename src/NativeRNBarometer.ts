import type {CodegenTypes, TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type BarometerPayload = {
  timestamp: number;
  pressure: number;
  altitudeASL: number;
  altitude: number;
  relativeAltitude: number;
  verticalSpeed: number;
};

export type BarometerError = {
  code: string;
  message: string;
};

export interface Spec extends TurboModule {
  readonly onBarometerUpdate: CodegenTypes.EventEmitter<BarometerPayload>;
  readonly onBarometerError: CodegenTypes.EventEmitter<BarometerError>;
  isSupported(): Promise<boolean>;
  getAuthorizationStatus(): Promise<string>;
  setInterval(interval: number): void;
  setLocalPressure(pressure: number): void;
  resetRelativeAltitude(): void;
  startObserving(): void;
  stopObserving(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNBarometer');
