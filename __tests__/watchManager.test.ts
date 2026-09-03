import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createWatchManager} from '../src/watchManager.ts';

describe('watchManager', () => {
  it('starts native observing once for multiple watches', () => {
    let startCount = 0;
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {
      startCount += 1;
    });
    mgr.addWatch(() => ({remove() {}}));
    mgr.addWatch(() => ({remove() {}}));
    assert.equal(startCount, 1);
    assert.equal(mgr.activeWatcherCount, 2);
    assert.equal(mgr.observing, true);
  });

  it('stops native observing when last watch cleared', () => {
    let stopCount = 0;
    const mgr = createWatchManager();
    mgr.startObservingIfNeeded(() => {});
    const id0 = mgr.addWatch(() => ({remove() {}}));
    const id1 = mgr.addWatch(() => ({remove() {}}));
    mgr.clearWatch(id0, sub => sub.remove(), () => {
      stopCount += 1;
    });
    assert.equal(stopCount, 0);
    mgr.clearWatch(id1, sub => sub.remove(), () => {
      stopCount += 1;
    });
    assert.equal(stopCount, 1);
    assert.equal(mgr.observing, false);
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
    assert.equal(removed, 2);
    assert.equal(stopCount, 1);
    assert.equal(mgr.activeWatcherCount, 0);
  });

  it('notifies every watch error callback', () => {
    const mgr = createWatchManager();
    const codes: string[] = [];
    mgr.addWatch(() => ({remove() {}}), err => {
      codes.push(`a:${err.code}`);
    });
    mgr.addWatch(() => ({remove() {}}), err => {
      codes.push(`b:${err.code}`);
    });
    mgr.addWatch(() => ({remove() {}}));
    mgr.notifyErrors({code: 'no_sensor', message: 'missing'});
    assert.deepEqual(codes, ['a:no_sensor', 'b:no_sensor']);
  });
});
