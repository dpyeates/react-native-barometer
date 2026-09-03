/**
 * @format
 */

import React, {useCallback, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import Barometer, {
  DEFAULT_INTERVAL_MS,
  MIN_INTERVAL_MS,
  STANDARD_PRESSURE_HPA,
  getAltitude,
  useBarometer,
  type BarometerPayload,
} from 'react-native-barometer';

const INTERVAL_PRESETS = [MIN_INTERVAL_MS, DEFAULT_INTERVAL_MS, 1000] as const;

function PayloadLines({
  payload,
  textColor,
}: {
  payload: BarometerPayload;
  textColor: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, {color: textColor}]}>
        Pressure: {payload.pressure.toFixed(2)} hPa
      </Text>
      <Text style={[styles.value, {color: textColor}]}>
        Altitude (ASL): {payload.altitudeASL.toFixed(1)} m
      </Text>
      <Text style={[styles.value, {color: textColor}]}>
        Altitude (local): {payload.altitude.toFixed(1)} m
      </Text>
      <Text style={[styles.value, {color: textColor}]}>
        Relative: {payload.relativeAltitude.toFixed(1)} m
      </Text>
      <Text style={[styles.value, {color: textColor}]}>
        Vertical speed: {payload.verticalSpeed.toFixed(2)} m/s
      </Text>
    </View>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const {
    payload,
    error,
    supported,
    authorizationStatus,
    observing,
    start,
    stop,
  } = useBarometer({autoStart: false});
  const [pressureInput, setPressureInput] = useState(
    String(STANDARD_PRESSURE_HPA),
  );
  const [appliedLocalPressure, setAppliedLocalPressure] = useState(
    STANDARD_PRESSURE_HPA,
  );
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const [oneShot, setOneShot] = useState<BarometerPayload | null>(null);
  const [oneShotError, setOneShotError] = useState<string | null>(null);
  const [oneShotPending, setOneShotPending] = useState(false);

  const textColor = isDarkMode ? '#f2f2f7' : '#1c1c1e';
  const mutedColor = isDarkMode ? '#8e8e93' : '#636366';
  const fieldBg = isDarkMode ? '#2c2c2e' : '#f2f2f7';
  const buttonBg = isDarkMode ? '#0a84ff' : '#007aff';
  const errorBg = isDarkMode ? '#3a1c1c' : '#fdecea';
  const errorFg = isDarkMode ? '#ff8a80' : '#b3261e';

  const jsAltitude = useMemo(() => {
    if (payload == null) {
      return null;
    }
    return getAltitude(appliedLocalPressure, payload.pressure);
  }, [appliedLocalPressure, payload]);

  const applyInterval = useCallback((ms: number) => {
    Barometer.setInterval(ms);
    setIntervalMs(ms);
  }, []);

  const applyLocalPressure = () => {
    const parsed = Number.parseFloat(pressureInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    Barometer.setLocalPressure(parsed);
    setAppliedLocalPressure(parsed);
  };

  const useStandardPressure = () => {
    const value = STANDARD_PRESSURE_HPA;
    setPressureInput(String(value));
    Barometer.setLocalPressure(value);
    setAppliedLocalPressure(value);
  };

  const useCurrentPressure = () => {
    if (payload?.pressure == null) {
      return;
    }
    const value = payload.pressure;
    setPressureInput(value.toFixed(2));
    Barometer.setLocalPressure(value);
    setAppliedLocalPressure(value);
  };

  const takeOneShot = async () => {
    setOneShotPending(true);
    setOneShotError(null);
    try {
      const reading = await Barometer.getCurrentReading();
      setOneShot(reading);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setOneShotError(message);
    } finally {
      setOneShotPending(false);
    }
  };

  const localMatchesStandard =
    Math.abs(appliedLocalPressure - STANDARD_PRESSURE_HPA) < 0.01;
  const canStart = supported === true && !observing;
  const canStop = observing;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, {color: textColor}]}>
              Barometer Example
            </Text>
            <Text style={[styles.label, {color: mutedColor}]}>
              Supported:{' '}
              {supported === null ? 'checking…' : supported ? 'yes' : 'no'}
            </Text>
            <Text style={[styles.label, {color: mutedColor}]}>
              Authorization: {authorizationStatus ?? 'checking…'}
            </Text>
            <Text style={[styles.label, {color: mutedColor}]}>
              Observing: {observing ? 'yes' : 'no'}
            </Text>
            <Text style={[styles.label, {color: mutedColor}]}>
              Interval: {intervalMs} ms
            </Text>

            {error ? (
              <View style={[styles.banner, {backgroundColor: errorBg}]}>
                <Text style={[styles.bannerTitle, {color: errorFg}]}>
                  {error.code}
                </Text>
                <Text style={[styles.bannerBody, {color: errorFg}]}>
                  {error.message}
                </Text>
              </View>
            ) : null}

            {supported === false ? (
              <Text style={[styles.hint, {color: mutedColor}]}>
                No barometer on this device. Live watch is disabled.
              </Text>
            ) : null}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: textColor}]}>
                Live watch
              </Text>
              <View style={styles.row}>
                <Pressable
                  style={[
                    styles.button,
                    {backgroundColor: buttonBg, opacity: canStart ? 1 : 0.5},
                  ]}
                  onPress={start}
                  disabled={!canStart}>
                  <Text style={styles.buttonText}>Start</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.buttonSecondary,
                    {borderColor: buttonBg, opacity: canStop ? 1 : 0.5},
                  ]}
                  onPress={stop}
                  disabled={!canStop}>
                  <Text style={[styles.buttonSecondaryText, {color: buttonBg}]}>
                    Stop
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.buttonSecondary,
                    {borderColor: buttonBg, opacity: observing ? 1 : 0.5},
                  ]}
                  onPress={() => Barometer.resetRelativeAltitude()}
                  disabled={!observing}>
                  <Text style={[styles.buttonSecondaryText, {color: buttonBg}]}>
                    Reset relative
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: textColor}]}>
                Update interval
              </Text>
              <View style={styles.row}>
                {INTERVAL_PRESETS.map(ms => (
                  <Pressable
                    key={ms}
                    style={[
                      ms === intervalMs ? styles.button : styles.buttonSecondary,
                      ms === intervalMs
                        ? {backgroundColor: buttonBg}
                        : {borderColor: buttonBg},
                    ]}
                    onPress={() => applyInterval(ms)}>
                    <Text
                      style={
                        ms === intervalMs
                          ? styles.buttonText
                          : [styles.buttonSecondaryText, {color: buttonBg}]
                      }>
                      {ms} ms
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: textColor}]}>
                One-shot reading
              </Text>
              <Text style={[styles.hint, {color: mutedColor}]}>
                getCurrentReading() takes the next sample without requiring an
                active live watch.
              </Text>
              <Pressable
                style={[
                  styles.button,
                  {
                    backgroundColor: buttonBg,
                    opacity: supported === true && !oneShotPending ? 1 : 0.5,
                  },
                ]}
                onPress={takeOneShot}
                disabled={supported !== true || oneShotPending}>
                <Text style={styles.buttonText}>
                  {oneShotPending ? 'Reading…' : 'Get current reading'}
                </Text>
              </Pressable>
              {oneShotError ? (
                <Text style={[styles.hint, {color: errorFg, marginTop: 8}]}>
                  {oneShotError}
                </Text>
              ) : null}
              {oneShot ? (
                <View style={styles.oneShot}>
                  <Text style={[styles.note, {color: mutedColor}]}>
                    Last one-shot
                  </Text>
                  <PayloadLines payload={oneShot} textColor={textColor} />
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: textColor}]}>
                Local sea-level pressure
              </Text>
              <Text style={[styles.hint, {color: mutedColor}]}>
                This is the sea-level reference (QNH), not the live reading.
                ASL always uses {STANDARD_PRESSURE_HPA} hPa. Local altitude uses
                whatever you set here — so it matches ASL when you choose
                standard atmosphere.
              </Text>
              <Text style={[styles.label, {color: mutedColor}]}>
                Active reference: {appliedLocalPressure.toFixed(2)} hPa
              </Text>
              {localMatchesStandard ? (
                <Text style={[styles.note, {color: mutedColor}]}>
                  Local altitude will match ASL (~
                  {payload?.altitudeASL?.toFixed(1) ?? '—'} m) because both use
                  1013.25 hPa as sea level.
                </Text>
              ) : null}
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: fieldBg, color: textColor},
                ]}
                value={pressureInput}
                onChangeText={setPressureInput}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={applyLocalPressure}
                placeholder="Pressure in hPa"
                placeholderTextColor={mutedColor}
              />
              <View style={styles.row}>
                <Pressable
                  style={[styles.button, {backgroundColor: buttonBg}]}
                  onPress={applyLocalPressure}>
                  <Text style={styles.buttonText}>Apply</Text>
                </Pressable>
                <Pressable
                  style={[styles.buttonSecondary, {borderColor: buttonBg}]}
                  onPress={useStandardPressure}>
                  <Text style={[styles.buttonSecondaryText, {color: buttonBg}]}>
                    Standard ({STANDARD_PRESSURE_HPA})
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.buttonSecondary,
                    {borderColor: buttonBg, opacity: payload ? 1 : 0.5},
                  ]}
                  onPress={useCurrentPressure}
                  disabled={!payload}>
                  <Text style={[styles.buttonSecondaryText, {color: buttonBg}]}>
                    Use current reading
                  </Text>
                </Pressable>
              </View>
            </View>

            {payload ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, {color: textColor}]}>
                  Live payload
                </Text>
                <PayloadLines payload={payload} textColor={textColor} />
                {jsAltitude != null ? (
                  <Text style={[styles.hint, {color: mutedColor, marginTop: 8}]}>
                    getAltitude({appliedLocalPressure.toFixed(2)},{' '}
                    {payload.pressure.toFixed(2)}) = {jsAltitude.toFixed(1)} m
                    (native local {payload.altitude.toFixed(1)} m)
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.label, {color: mutedColor}]}>
                {supported === false
                  ? 'Barometer not available on this device.'
                  : 'Start the live watch or take a one-shot reading.'}
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  banner: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    gap: 8,
  },
  value: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  oneShot: {
    marginTop: 12,
  },
});

export default App;
