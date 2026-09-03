export type WatchSubscription = {
  remove: () => void;
};

export type WatchRecord<T extends WatchSubscription = WatchSubscription> = {
  listener: T;
  error?: ((error: {code: string; message: string}) => void) | undefined;
};

/**
 * Tracks active watch listeners and whether native observing should be running.
 */
export function createWatchManager<
  T extends WatchSubscription = WatchSubscription,
>() {
  let subscriptions: Array<WatchRecord<T> | undefined> = [];
  let activeWatcherCount = 0;
  let observing = false;

  return {
    get activeWatcherCount() {
      return activeWatcherCount;
    },
    get observing() {
      return observing;
    },
    startObservingIfNeeded(startNative: () => void) {
      if (!observing) {
        startNative();
        observing = true;
      }
    },
    addWatch(
      addListener: () => T,
      error?: (error: {code: string; message: string}) => void,
    ) {
      const watchID = subscriptions.length;
      subscriptions.push({
        listener: addListener(),
        error,
      });
      activeWatcherCount += 1;
      return watchID;
    },
    clearWatch(
      watchID: number,
      removeListener: (listener: T) => void,
      stopNative: () => void,
    ) {
      const sub = subscriptions[watchID];
      if (!sub) {
        return;
      }
      removeListener(sub.listener);
      subscriptions[watchID] = undefined;
      activeWatcherCount -= 1;
      if (activeWatcherCount <= 0) {
        activeWatcherCount = 0;
        stopNative();
        observing = false;
      }
    },
    stopAll(removeListener: (listener: T) => void, stopNative: () => void) {
      stopNative();
      for (let ii = 0; ii < subscriptions.length; ii++) {
        const sub = subscriptions[ii];
        if (sub) {
          removeListener(sub.listener);
        }
      }
      subscriptions = [];
      activeWatcherCount = 0;
      observing = false;
    },
    notifyErrors(error: {code: string; message: string}) {
      for (let ii = 0; ii < subscriptions.length; ii++) {
        const sub = subscriptions[ii];
        if (sub?.error) {
          sub.error(error);
        }
      }
    },
  };
}
