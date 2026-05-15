'use strict';

const {describe, it} = require('node:test');
const assert = require('node:assert');
const {createWatchManager} = require('../src/watchManager');

describe('watchManager', () => {
  it('starts native observing once for multiple watches', () => {
    let startCount = 0;
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {
      startCount += 1;
    });
    mgr.addWatch(() => ({id: 1}));
    mgr.addWatch(() => ({id: 2}));
    assert.strictEqual(startCount, 1);
    assert.strictEqual(mgr.activeWatcherCount, 2);
    assert.strictEqual(mgr.observing, true);
  });

  it('stops native observing when last watch cleared', () => {
    let stopCount = 0;
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {});
    const id0 = mgr.addWatch(() => ({id: 1}));
    const id1 = mgr.addWatch(() => ({id: 2}));
    mgr.clearWatch(id0, () => {}, () => {
      stopCount += 1;
    });
    assert.strictEqual(stopCount, 0);
    mgr.clearWatch(id1, () => {}, () => {
      stopCount += 1;
    });
    assert.strictEqual(stopCount, 1);
    assert.strictEqual(mgr.observing, false);
  });

  it('stopAll clears all watchers', () => {
    let stopCount = 0;
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {});
    mgr.addWatch(() => ({id: 1}));
    mgr.addWatch(() => ({id: 2}));
    let removed = 0;
    mgr.stopAll(
      () => {
        removed += 1;
      },
      () => {
        stopCount += 1;
      },
    );
    assert.strictEqual(removed, 2);
    assert.strictEqual(stopCount, 1);
    assert.strictEqual(mgr.activeWatcherCount, 0);
  });
});
