import {getNativeRNBarometer} from './NativeRNBarometer';
import type {
  BarometerErrorPayload,
  BarometerPayload,
} from './NativeRNBarometer';
import {
  clampInterval,
  clampSmoothing,
  validatePressure,
  STANDARD_PRESSURE_HPA,
  DEFAULT_INTERVAL_MS,
  MIN_INTERVAL_MS,
  DEFAULT_SMOOTHING,
} from './validation';
import {createWatchManager} from './watchManager';
import type {WatchSubscription} from './watchManager';

export type {BarometerErrorPayload, BarometerPayload};
export type BarometerWatchCallback = (payload: BarometerPayload) => void;
export type BarometerErrorCallback = (error: BarometerErrorPayload) => void;

export {
  STANDARD_PRESSURE_HPA,
  DEFAULT_INTERVAL_MS,
  MIN_INTERVAL_MS,
  DEFAULT_SMOOTHING,
};

const watchManager = createWatchManager();

function warnMissingNative(method: string): void {
  console.warn(
    `[react-native-barometer] Native module unavailable; ${method} is a no-op. ` +
      'Ensure New Architecture is enabled and the package is linked.',
  );
}

type ListenerBundle = {
  update: WatchSubscription;
  error: WatchSubscription | null;
};

const Barometer = {
  /**
   * Start receiving barometer updates. Returns a watch id for `clearWatch`.
   * If the native module is missing, logs a warning and returns `-1`.
   */
  watch(
    success: BarometerWatchCallback,
    onError?: BarometerErrorCallback,
  ): number {
    const native = getNativeRNBarometer();
    if (native == null) {
      warnMissingNative('watch');
      return -1;
    }

    watchManager.startObservingIfNeeded(() => native.startObserving());
    return watchManager.addWatch(() => {
      const update = native.onBarometerUpdate(success);
      const error = native.onBarometerError(err => {
        // Native stops observing after fatal sensor errors; keep JS watches
        // but allow a later watch()/start to call startObserving again.
        watchManager.markNativeStopped();
        onError?.(err);
      });
      const bundle: ListenerBundle = {update, error};
      return {
        remove() {
          bundle.update.remove();
          bundle.error?.remove();
        },
      };
    });
  },

  clearWatch(watchID: number): void {
    if (watchID < 0) {
      return;
    }
    const native = getNativeRNBarometer();
    watchManager.clearWatch(
      watchID,
      sub => sub.remove(),
      () => native?.stopObserving(),
    );
  },

  stopObserving(): void {
    const native = getNativeRNBarometer();
    watchManager.stopAll(
      sub => sub.remove(),
      () => native?.stopObserving(),
    );
  },

  async isSupported(): Promise<boolean> {
    const native = getNativeRNBarometer();
    if (native == null) {
      return false;
    }
    return native.isSupported();
  },

  setInterval(interval: number): void {
    const native = getNativeRNBarometer();
    if (native == null) {
      warnMissingNative('setInterval');
      return;
    }
    native.setInterval(clampInterval(interval));
  },

  setLocalPressure(pressure: number): void {
    const native = getNativeRNBarometer();
    if (native == null) {
      warnMissingNative('setLocalPressure');
      return;
    }
    native.setLocalPressure(validatePressure(pressure));
  },

  /**
   * EMA smoothing factor in (0, 1]. `1` passes raw pressure through;
   * lower values smooth more. Default `0.3`.
   */
  setSmoothing(alpha: number): void {
    const native = getNativeRNBarometer();
    if (native == null) {
      warnMissingNative('setSmoothing');
      return;
    }
    native.setSmoothing(clampSmoothing(alpha));
  },

  /**
   * Calibrate local sea-level pressure from a known altitude in metres
   * (e.g. airport elevation), using the latest pressure sample when available.
   */
  setAltitudeReference(metres: number): void {
    const native = getNativeRNBarometer();
    if (native == null) {
      warnMissingNative('setAltitudeReference');
      return;
    }
    native.setAltitudeReference(Number(metres));
  },

  /** Reset relative altitude baseline to zero on the next sample. */
  resetRelativeAltitude(): void {
    const native = getNativeRNBarometer();
    if (native == null) {
      warnMissingNative('resetRelativeAltitude');
      return;
    }
    native.resetRelativeAltitude();
  },
};

export default Barometer;
