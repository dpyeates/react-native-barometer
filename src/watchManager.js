'use strict';

/**
 * Tracks active watch listeners and whether native observing should be running.
 */
function createWatchManager() {
  let subscriptions = [];
  let activeWatcherCount = 0;
  let observing = false;

  return {
    get activeWatcherCount() {
      return activeWatcherCount;
    },
    get observing() {
      return observing;
    },
    startObservingIfNeeded(startNative) {
      if (!observing) {
        startNative();
        observing = true;
      }
    },
    addWatch(addListener) {
      const watchID = subscriptions.length;
      subscriptions.push(addListener());
      activeWatcherCount += 1;
      return watchID;
    },
    clearWatch(watchID, removeListener, stopNative) {
      const sub = subscriptions[watchID];
      if (!sub) {
        return;
      }
      removeListener(sub);
      subscriptions[watchID] = undefined;
      activeWatcherCount -= 1;
      if (activeWatcherCount <= 0) {
        activeWatcherCount = 0;
        stopNative();
        observing = false;
      }
    },
    stopAll(removeListener, stopNative) {
      stopNative();
      for (let ii = 0; ii < subscriptions.length; ii++) {
        const sub = subscriptions[ii];
        if (sub) {
          removeListener(sub);
        }
      }
      subscriptions = [];
      activeWatcherCount = 0;
      observing = false;
    },
  };
}

module.exports = {createWatchManager};
