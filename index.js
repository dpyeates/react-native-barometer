'use strict';
import {NativeEventEmitter, NativeModules} from 'react-native';

const {RNBarometer} = NativeModules;
const BarometerEventEmitter = new NativeEventEmitter(RNBarometer);
let barometerSubscriptions = [];
let barometerUpdatesEnabled = false;

const Barometer = {

  // Starts watching/observing of barometer/altitude
  // The success function is called upon every change
  watch: function(success) {
    if (!barometerUpdatesEnabled) {
      RNBarometer.startObserving();
      barometerUpdatesEnabled = true;
    }
    const watchID = barometerSubscriptions.length;
    barometerSubscriptions.push(BarometerEventEmitter.addListener('barometerUpdate', success));
    return watchID;
  },

  // Stops all watching/observing of the passed in watch ID
  clearWatch: function(watchID) {
    const sub = barometerSubscriptions[watchID];
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      return;
    }
    sub.remove(); // removes the listener
    barometerSubscriptions[watchID] = undefined;
    // check for any remaining watchers
    let noWatchers = true;
    for (let ii = 0; ii < barometer.length; ii++) {
      if (barometerSubscriptions[ii]) {
        noWatchers = false; // still valid watchers
      }
    }
    if (noWatchers) {
      RNBarometer.stopObserving();
      barometerUpdatesEnabled = false;
    }
  },

  // Stop all watching/observing
  stopObserving: function() {
    let ii = 0;
    RNBarometer.stopObserving();
    for (ii = 0; ii < barometerSubscriptions.length; ii++) {
      const sub = barometerSubscriptions[ii];
      if (sub) {
        sub.remove();
      }
    }
    barometerSubscriptions = [];
    barometerUpdatesEnabled = false;
  },

  // Indicates if barometer updates are available on this device
  isSupported: async function() {
    return await RNBarometer.isSupported();
  },

  // Sets the interval between event samples
  setInterval: function(interval) {
    RNBarometer.setInterval(interval);
    if(barometerUpdatesEnabled) {
      RNBarometer.stopObserving();
      RNBarometer.startObserving();
    }
  },

  // Sets the local air pressure in hPA/Millibars
  setLocalPressure: function(pressure) {
    RNBarometer.setLocalPressure(pressure);
  }

};

export default Barometer;

