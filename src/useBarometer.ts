import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';
import type {BarometerError, BarometerPayload} from './NativeRNBarometer';
import type {AuthorizationStatus} from './createBarometer';
import {isFatalBarometerError} from './validation';
import Barometer from './barometer';

export type UseBarometerOptions = {
  autoStart?: boolean;
  interval?: number;
};

export type UseBarometerResult = {
  payload: BarometerPayload | null;
  error: BarometerError | null;
  supported: boolean | null;
  authorizationStatus: AuthorizationStatus | null;
  observing: boolean;
  start: () => void;
  stop: () => void;
};

export function useBarometer(
  options: UseBarometerOptions = {},
): UseBarometerResult {
  const {autoStart = true, interval} = options;
  const [payload, setPayload] = useState<BarometerPayload | null>(null);
  const [error, setError] = useState<BarometerError | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [authorizationStatus, setAuthorizationStatus] =
    useState<AuthorizationStatus | null>(null);
  const [observing, setObserving] = useState(false);
  const watchIdRef = useRef<number | undefined>(undefined);
  const receivedSampleRef = useRef(false);

  const refreshAuthorization = useCallback(() => {
    Barometer.getAuthorizationStatus().then(setAuthorizationStatus);
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== undefined) {
      Barometer.clearWatch(watchIdRef.current);
      watchIdRef.current = undefined;
    }
    receivedSampleRef.current = false;
    setObserving(false);
  }, []);

  const start = useCallback(() => {
    if (watchIdRef.current !== undefined) {
      return;
    }
    setError(null);
    receivedSampleRef.current = false;
    let stillLive = true;
    const watchID = Barometer.watch(
      next => {
        setPayload(next);
        setError(null);
        if (!receivedSampleRef.current) {
          receivedSampleRef.current = true;
          refreshAuthorization();
        }
      },
      err => {
        setError(err);
        if (isFatalBarometerError(err.code)) {
          stillLive = false;
          watchIdRef.current = undefined;
          receivedSampleRef.current = false;
          setObserving(false);
        }
      },
    );
    if (!stillLive) {
      Barometer.clearWatch(watchID);
      return;
    }
    watchIdRef.current = watchID;
    setObserving(true);
    refreshAuthorization();
  }, [refreshAuthorization]);

  useEffect(() => {
    Barometer.isSupported().then(setSupported);
    refreshAuthorization();
  }, [refreshAuthorization]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: string) => {
      if (state === 'active' && watchIdRef.current !== undefined) {
        refreshAuthorization();
      }
    });
    return () => {
      sub.remove();
    };
  }, [refreshAuthorization]);

  useEffect(() => {
    if (interval != null) {
      Barometer.setInterval(interval);
    }
  }, [interval]);

  useEffect(() => {
    if (autoStart && supported === true) {
      start();
    }
    return () => {
      stop();
    };
  }, [autoStart, supported, start, stop]);

  return {
    payload,
    error,
    supported,
    authorizationStatus,
    observing,
    start,
    stop,
  };
}
