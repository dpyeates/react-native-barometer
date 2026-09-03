/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-barometer', () => {
  const STANDARD_PRESSURE_HPA = 1013.25;
  return {
    __esModule: true,
    STANDARD_PRESSURE_HPA,
    DEFAULT_INTERVAL_MS: 200,
    MIN_INTERVAL_MS: 50,
    getAltitude: () => 0,
    useBarometer: () => ({
      payload: null,
      error: null,
      supported: false,
      authorizationStatus: 'authorized',
      observing: false,
      start: jest.fn(),
      stop: jest.fn(),
    }),
    default: {
      isSupported: async () => false,
      getAuthorizationStatus: async () => 'authorized',
      setLocalPressure: jest.fn(),
      setInterval: jest.fn(),
      resetRelativeAltitude: jest.fn(),
      getCurrentReading: async () => {
        throw new Error('not supported');
      },
      watch: () => 0,
      clearWatch: jest.fn(),
      stopObserving: jest.fn(),
    },
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
