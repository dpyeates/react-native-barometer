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

export interface Spec extends TurboModule {
  readonly onBarometerUpdate: CodegenTypes.EventEmitter<BarometerPayload>;
  isSupported(): Promise<boolean>;
  setInterval(interval: number): void;
  setLocalPressure(pressure: number): void;
  startObserving(): void;
  stopObserving(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNBarometer');
