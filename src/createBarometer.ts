import type {BarometerError, BarometerPayload, Spec} from './NativeRNBarometer';
import {createWatchManager} from './watchManager';
import {
  clampInterval,
  isFatalBarometerError,
  validatePressure,
} from './validation';

export type AuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'restricted'
  | 'authorized';

export type BarometerModule = {
  watch(
    success: (payload: BarometerPayload) => void,
    error?: (error: BarometerError) => void,
  ): number;
  clearWatch(watchID: number): void;
  stopObserving(): void;
  isSupported(): Promise<boolean>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  setInterval(interval: number): void;
  setLocalPressure(pressure: number): void;
  resetRelativeAltitude(): void;
  getCurrentReading(): Promise<BarometerPayload>;
};

type EventSubscription = {remove: () => void};

type NativeBarometer = Pick<
  Spec,
  | 'onBarometerUpdate'
  | 'onBarometerError'
  | 'isSupported'
  | 'getAuthorizationStatus'
  | 'setInterval'
  | 'setLocalPressure'
  | 'resetRelativeAltitude'
  | 'startObserving'
  | 'stopObserving'
>;

export function createBarometer(native: NativeBarometer): BarometerModule {
  const watchManager = createWatchManager<EventSubscription>();
  let nativeErrorSub: EventSubscription | undefined;

  const stopNative = () => {
    nativeErrorSub?.remove();
    nativeErrorSub = undefined;
    native.stopObserving();
  };

  const barometer: BarometerModule = {
    watch(success, error) {
      const watchID = watchManager.addWatch(
        () => native.onBarometerUpdate(success),
        error,
      );
      watchManager.startObservingIfNeeded(() => {
        nativeErrorSub = native.onBarometerError((err: BarometerError) => {
          watchManager.notifyErrors(err);
          if (isFatalBarometerError(err.code)) {
            barometer.stopObserving();
          }
        });
        native.startObserving();
      });
      return watchID;
    },

    clearWatch(watchID) {
      watchManager.clearWatch(
        watchID,
        sub => sub.remove(),
        stopNative,
      );
    },

    stopObserving() {
      watchManager.stopAll(sub => sub.remove(), stopNative);
    },

    async isSupported() {
      return await native.isSupported();
    },

    async getAuthorizationStatus() {
      return (await native.getAuthorizationStatus()) as AuthorizationStatus;
    },

    setInterval(interval) {
      native.setInterval(clampInterval(interval));
    },

    setLocalPressure(pressure) {
      native.setLocalPressure(validatePressure(pressure));
    },

    resetRelativeAltitude() {
      native.resetRelativeAltitude();
    },

    getCurrentReading() {
      return new Promise((resolve, reject) => {
        const watchID = barometer.watch(
          payload => {
            barometer.clearWatch(watchID);
            resolve(payload);
          },
          err => {
            if (!isFatalBarometerError(err.code)) {
              return;
            }
            barometer.clearWatch(watchID);
            const failure = new Error(err.message) as Error & {code: string};
            failure.code = err.code;
            reject(failure);
          },
        );
      });
    },
  };

  return barometer;
}
