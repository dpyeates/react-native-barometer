import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  clampInterval,
  getAltitude,
  isFatalBarometerError,
  MIN_INTERVAL_MS,
  STANDARD_PRESSURE_HPA,
  validatePressure,
} from '../src/validation.ts';

describe('validation', () => {
  it('clampInterval enforces minimum', () => {
    assert.equal(clampInterval(0), MIN_INTERVAL_MS);
    assert.equal(clampInterval(-10), MIN_INTERVAL_MS);
    assert.equal(clampInterval(500), 500);
  });

  it('validatePressure rejects invalid values', () => {
    assert.equal(validatePressure(0), STANDARD_PRESSURE_HPA);
    assert.equal(validatePressure(-5), STANDARD_PRESSURE_HPA);
    assert.equal(validatePressure(985), 985);
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

  it('classifies fatal barometer errors', () => {
    assert.equal(isFatalBarometerError('no_sensor'), true);
    assert.equal(isFatalBarometerError('unauthorized'), true);
    assert.equal(isFatalBarometerError('altimeter_error'), true);
    assert.equal(isFatalBarometerError('unreliable'), false);
  });
});
