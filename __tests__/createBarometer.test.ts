import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createBarometer} from '../src/createBarometer.ts';
import type {BarometerError, BarometerPayload} from '../src/NativeRNBarometer.ts';

function samplePayload(
  overrides: Partial<BarometerPayload> = {},
): BarometerPayload {
  return {
    timestamp: 1,
    pressure: 1013.25,
    altitudeASL: 0,
    altitude: 10,
    relativeAltitude: 1,
    verticalSpeed: 0,
    ...overrides,
  };
}

function createMockNative() {
  const updateListeners: Array<(payload: BarometerPayload) => void> = [];
  const errorListeners: Array<(error: BarometerError) => void> = [];
  const native = {
    startObservingCalls: 0,
    stopObservingCalls: 0,
    resetCalls: 0,
    lastInterval: undefined as number | undefined,
    lastPressure: undefined as number | undefined,
    startObserving() {
      native.startObservingCalls += 1;
    },
    stopObserving() {
      native.stopObservingCalls += 1;
    },
    onBarometerUpdate(cb: (payload: BarometerPayload) => void) {
      updateListeners.push(cb);
      return {
        remove() {
          const index = updateListeners.indexOf(cb);
          if (index >= 0) {
            updateListeners.splice(index, 1);
          }
        },
      };
    },
    onBarometerError(cb: (error: BarometerError) => void) {
      errorListeners.push(cb);
      return {
        remove() {
          const index = errorListeners.indexOf(cb);
          if (index >= 0) {
            errorListeners.splice(index, 1);
          }
        },
      };
    },
    isSupported: async () => true,
    getAuthorizationStatus: async () => 'authorized',
    setInterval(interval: number) {
      native.lastInterval = interval;
    },
    setLocalPressure(pressure: number) {
      native.lastPressure = pressure;
    },
    resetRelativeAltitude() {
      native.resetCalls += 1;
    },
    emitUpdate(payload: BarometerPayload) {
      for (const listener of [...updateListeners]) {
        listener(payload);
      }
    },
    emitError(error: BarometerError) {
      for (const listener of [...errorListeners]) {
        listener(error);
      }
    },
  };
  return native;
}

describe('createBarometer', () => {
  it('ref-counts watchers and starts native once', () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    const id0 = barometer.watch(() => {});
    const id1 = barometer.watch(() => {});
    assert.equal(native.startObservingCalls, 1);
    barometer.clearWatch(id0);
    assert.equal(native.stopObservingCalls, 0);
    barometer.clearWatch(id1);
    assert.equal(native.stopObservingCalls, 1);
  });

  it('delivers updates and optional error callbacks', () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    const updates: number[] = [];
    const errors: string[] = [];
    barometer.watch(
      payload => {
        updates.push(payload.pressure);
      },
      err => {
        errors.push(err.code);
      },
    );
    native.emitUpdate(samplePayload({pressure: 1000}));
    native.emitError({code: 'unreliable', message: 'noisy'});
    assert.deepEqual(updates, [1000]);
    assert.deepEqual(errors, ['unreliable']);
    assert.equal(native.stopObservingCalls, 0);
  });

  it('stops observing on fatal native errors', () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    const errors: string[] = [];
    barometer.watch(
      () => {},
      err => {
        errors.push(err.code);
      },
    );
    native.emitError({code: 'no_sensor', message: 'missing'});
    assert.deepEqual(errors, ['no_sensor']);
    assert.equal(native.stopObservingCalls, 1);
  });

  it('clamps interval before calling native', () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    barometer.setInterval(10);
    assert.equal(native.lastInterval, 50);
    barometer.setInterval(1000);
    assert.equal(native.lastInterval, 1000);
  });

  it('resolves getCurrentReading from the next sample', async () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    const pending = barometer.getCurrentReading();
    native.emitUpdate(samplePayload({pressure: 987}));
    const payload = await pending;
    assert.equal(payload.pressure, 987);
    assert.equal(native.stopObservingCalls, 1);
  });

  it('rejects getCurrentReading on fatal errors', async () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    const pending = barometer.getCurrentReading();
    native.emitError({code: 'unauthorized', message: 'denied'});
    await assert.rejects(pending, /denied/);
  });

  it('keeps getCurrentReading open after non-fatal errors', async () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    const pending = barometer.getCurrentReading();
    native.emitError({code: 'unreliable', message: 'noisy'});
    native.emitUpdate(samplePayload({pressure: 999}));
    const payload = await pending;
    assert.equal(payload.pressure, 999);
    assert.equal(native.stopObservingCalls, 1);
  });

  it('forwards resetRelativeAltitude', () => {
    const native = createMockNative();
    const barometer = createBarometer(native);
    barometer.resetRelativeAltitude();
    assert.equal(native.resetCalls, 1);
  });
});
