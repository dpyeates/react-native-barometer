'use strict';

import NativeRNBarometer from './src/NativeRNBarometer';
const {
  clampInterval,
  validatePressure,
  STANDARD_PRESSURE_HPA,
  DEFAULT_INTERVAL_MS,
  MIN_INTERVAL_MS,
} = require('./src/validation');
const {createWatchManager} = require('./src/watchManager');

export {STANDARD_PRESSURE_HPA, DEFAULT_INTERVAL_MS, MIN_INTERVAL_MS};

const watchManager = createWatchManager();

const Barometer = {
  watch: function (success) {
    watchManager.startObservingIfNeeded(() => NativeRNBarometer.startObserving());
    return watchManager.addWatch(() =>
      NativeRNBarometer.onBarometerUpdate(success),
    );
  },

  clearWatch: function (watchID) {
    watchManager.clearWatch(
      watchID,
      sub => sub.remove(),
      () => NativeRNBarometer.stopObserving(),
    );
  },

  stopObserving: function () {
    watchManager.stopAll(
      sub => sub.remove(),
      () => NativeRNBarometer.stopObserving(),
    );
  },

  isSupported: async function () {
    return await NativeRNBarometer.isSupported();
  },

  setInterval: function (interval) {
    NativeRNBarometer.setInterval(clampInterval(interval));
  },

  setLocalPressure: function (pressure) {
    NativeRNBarometer.setLocalPressure(validatePressure(pressure));
  },
};

export default Barometer;
