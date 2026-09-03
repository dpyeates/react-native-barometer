'use strict';

const {describe, it} = require('node:test');
const assert = require('node:assert');
const {
  clampInterval,
  validatePressure,
  clampSmoothing,
  getAltitude,
  pressureFromAltitude,
  STANDARD_PRESSURE_HPA,
  MIN_INTERVAL_MS,
  DEFAULT_SMOOTHING,
} = require('../lib/validation');

describe('validation', () => {
  it('clampInterval enforces minimum', () => {
    assert.strictEqual(clampInterval(0), MIN_INTERVAL_MS);
    assert.strictEqual(clampInterval(-10), MIN_INTERVAL_MS);
    assert.strictEqual(clampInterval(500), 500);
  });

  it('validatePressure rejects invalid values', () => {
    assert.strictEqual(validatePressure(0), STANDARD_PRESSURE_HPA);
    assert.strictEqual(validatePressure(-5), STANDARD_PRESSURE_HPA);
    assert.strictEqual(validatePressure(985), 985);
  });

  it('clampSmoothing clamps to (0.01, 1]', () => {
    assert.strictEqual(clampSmoothing(0), 0.01);
    assert.strictEqual(clampSmoothing(2), 1);
    assert.strictEqual(clampSmoothing(Number.NaN), DEFAULT_SMOOTHING);
    assert.strictEqual(clampSmoothing(0.5), 0.5);
  });

  it('getAltitude at standard pressure is near zero', () => {
    const alt = getAltitude(STANDARD_PRESSURE_HPA, STANDARD_PRESSURE_HPA);
    assert.ok(Math.abs(alt) < 1);
  });

  it('getAltitude decreases as pressure increases', () => {
    const low = getAltitude(STANDARD_PRESSURE_HPA, 1000);
    const high = getAltitude(STANDARD_PRESSURE_HPA, 1020);
    assert.ok(low > high);
  });

  it('pressureFromAltitude round-trips with getAltitude', () => {
    const station = 980;
    const alt = 300;
    const p0 = pressureFromAltitude(alt, station);
    const recovered = getAltitude(p0, station);
    assert.ok(Math.abs(recovered - alt) < 0.5);
  });
});
