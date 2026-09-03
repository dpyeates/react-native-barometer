export type WatchSubscription = {
  remove: () => void;
};

export type WatchManager = {
  readonly activeWatcherCount: number;
  readonly observing: boolean;
  startObservingIfNeeded: (startNative: () => void) => void;
  /** Native stopped on its own (e.g. sensor error); keep JS watches. */
  markNativeStopped: () => void;
  addWatch: (addListener: () => WatchSubscription) => number;
  clearWatch: (
    watchID: number,
    removeListener: (sub: WatchSubscription) => void,
    stopNative: () => void,
  ) => void;
  stopAll: (
    removeListener: (sub: WatchSubscription) => void,
    stopNative: () => void,
  ) => void;
};

/**
 * Tracks active watch listeners with monotonic IDs (no sparse-array holes).
 */
export function createWatchManager(): WatchManager {
  const subscriptions = new Map<number, WatchSubscription>();
  let nextWatchId = 1;
  let observing = false;

  return {
    get activeWatcherCount() {
      return subscriptions.size;
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
    markNativeStopped() {
      observing = false;
    },
    addWatch(addListener) {
      const watchID = nextWatchId++;
      subscriptions.set(watchID, addListener());
      return watchID;
    },
    clearWatch(watchID, removeListener, stopNative) {
      const sub = subscriptions.get(watchID);
      if (!sub) {
        return;
      }
      removeListener(sub);
      subscriptions.delete(watchID);
      if (subscriptions.size === 0) {
        stopNative();
        observing = false;
      }
    },
    stopAll(removeListener, stopNative) {
      if (observing) {
        stopNative();
        observing = false;
      }
      for (const sub of subscriptions.values()) {
        removeListener(sub);
      }
      subscriptions.clear();
    },
  };
}
