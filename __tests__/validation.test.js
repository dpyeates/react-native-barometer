'use strict';

const {describe, it} = require('node:test');
const assert = require('node:assert');
const {
  clampInterval,
  validatePressure,
  getAltitude,
  STANDARD_PRESSURE_HPA,
  MIN_INTERVAL_MS,
} = require('../src/validation');

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

  it('getAltitude at standard pressure is near zero', () => {
    const alt = getAltitude(STANDARD_PRESSURE_HPA, STANDARD_PRESSURE_HPA);
    assert.ok(Math.abs(alt) < 1);
  });

  it('getAltitude decreases as pressure increases', () => {
    const low = getAltitude(STANDARD_PRESSURE_HPA, 1000);
    const high = getAltitude(STANDARD_PRESSURE_HPA, 1020);
    assert.ok(low > high);
  });
});
