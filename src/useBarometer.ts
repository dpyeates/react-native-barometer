import {useEffect, useRef, useState} from 'react';

import Barometer from './barometer';
import type {BarometerErrorPayload, BarometerPayload} from './barometer';

export type UseBarometerOptions = {
  /** When false, do not subscribe. Default true. */
  enabled?: boolean;
  /** Update interval in ms (clamped to >= 50). */
  interval?: number;
  /** Local sea-level pressure reference in hPa. */
  localPressure?: number;
  /** EMA smoothing factor in (0, 1]; 1 = raw. */
  smoothing?: number;
  /** Known altitude in metres; calibrates local sea-level pressure. */
  altitudeReference?: number;
  onError?: (error: BarometerErrorPayload) => void;
};

export type UseBarometerResult = {
  supported: boolean | null;
  data: BarometerPayload | null;
  error: BarometerErrorPayload | null;
};

/**
 * Subscribe to barometer updates with automatic cleanup.
 */
export function useBarometer(
  options: UseBarometerOptions = {},
): UseBarometerResult {
  const {
    enabled = true,
    interval,
    localPressure,
    smoothing,
    altitudeReference,
    onError,
  } = options;

  const [supported, setSupported] = useState<boolean | null>(null);
  const [data, setData] = useState<BarometerPayload | null>(null);
  const [error, setError] = useState<BarometerErrorPayload | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    Barometer.isSupported().then(value => {
      if (!cancelled) {
        setSupported(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (interval != null) {
      Barometer.setInterval(interval);
    }
  }, [interval]);

  useEffect(() => {
    if (localPressure != null) {
      Barometer.setLocalPressure(localPressure);
    }
  }, [localPressure]);

  useEffect(() => {
    if (smoothing != null) {
      Barometer.setSmoothing(smoothing);
    }
  }, [smoothing]);

  useEffect(() => {
    if (altitudeReference != null) {
      Barometer.setAltitudeReference(altitudeReference);
    }
  }, [altitudeReference]);

  useEffect(() => {
    if (!enabled || supported !== true) {
      return;
    }

    setError(null);
    const watchId = Barometer.watch(
      payload => {
        setData(payload);
      },
      err => {
        setError(err);
        onErrorRef.current?.(err);
      },
    );

    return () => {
      Barometer.clearWatch(watchId);
    };
  }, [enabled, supported]);

  if (!enabled) {
    return {supported: null, data: null, error: null};
  }

  return {supported, data, error};
}
