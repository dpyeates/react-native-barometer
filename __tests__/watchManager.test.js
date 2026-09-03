'use strict';

const {describe, it} = require('node:test');
const assert = require('node:assert');
const {createWatchManager} = require('../lib/watchManager');

describe('watchManager', () => {
  it('starts native observing once for multiple watches', () => {
    let startCount = 0;
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {
      startCount += 1;
    });
    const id0 = mgr.addWatch(() => ({remove() {}}));
    const id1 = mgr.addWatch(() => ({remove() {}}));
    assert.strictEqual(startCount, 1);
    assert.strictEqual(mgr.activeWatcherCount, 2);
    assert.strictEqual(mgr.observing, true);
    assert.notStrictEqual(id0, id1);
  });

  it('uses monotonic ids that do not reuse sparse holes', () => {
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {});
    const id0 = mgr.addWatch(() => ({remove() {}}));
    mgr.clearWatch(id0, () => {}, () => {});
    const id1 = mgr.addWatch(() => ({remove() {}}));
    assert.ok(id1 > id0);
  });

  it('stops native observing when last watch cleared', () => {
    let stopCount = 0;
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {});
    const id0 = mgr.addWatch(() => ({remove() {}}));
    const id1 = mgr.addWatch(() => ({remove() {}}));
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
    mgr.addWatch(() => ({remove() {}}));
    mgr.addWatch(() => ({remove() {}}));
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

  it('marks native stopped without clearing watches', () => {
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {});
    mgr.addWatch(() => ({remove() {}}));
    mgr.markNativeStopped();
    assert.strictEqual(mgr.observing, false);
    assert.strictEqual(mgr.activeWatcherCount, 1);
    let started = 0;
    mgr.startObservingIfNeeded(() => {
      started += 1;
    });
    assert.strictEqual(started, 1);
    assert.strictEqual(mgr.observing, true);
  });
});
