import React, {useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {
  useBarometer,
  STANDARD_PRESSURE_HPA,
  type BarometerPayload,
} from 'react-native-barometer';

function Metric({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function format(payload: BarometerPayload | null, key: keyof BarometerPayload) {
  if (payload == null) {
    return '—';
  }
  const value = payload[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }
  if (key === 'timestamp') {
    return new Date(value).toLocaleTimeString();
  }
  if (key === 'verticalSpeed') {
    return `${value.toFixed(2)} m/s`;
  }
  if (key === 'pressure') {
    return `${value.toFixed(2)} hPa`;
  }
  if (key === 'accuracy') {
    return value < 0 ? 'n/a' : String(value);
  }
  return `${value.toFixed(1)} m`;
}

export default function App() {
  const [enabled, setEnabled] = useState(true);
  const [intervalMs, setIntervalMs] = useState(200);
  const [smoothing, setSmoothing] = useState(0.3);
  const [localPressure, setLocalPressure] = useState(
    String(STANDARD_PRESSURE_HPA),
  );
  const [altitudeRef, setAltitudeRef] = useState('');

  const options = useMemo(
    () => ({
      enabled,
      interval: intervalMs,
      smoothing,
      localPressure: Number(localPressure) || STANDARD_PRESSURE_HPA,
      altitudeReference:
        altitudeRef.trim() === '' ? undefined : Number(altitudeRef),
    }),
    [enabled, intervalMs, smoothing, localPressure, altitudeRef],
  );

  const {supported, data, error} = useBarometer(options);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.brand}>react-native-barometer</Text>
          <Text style={styles.subtitle}>
            Live pressure, altitude, and vertical speed (New Architecture).
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Supported:{' '}
              {supported == null ? '…' : supported ? 'yes' : 'no'}
            </Text>
            <Pressable
              style={[styles.button, enabled ? styles.buttonOn : null]}
              onPress={() => setEnabled(value => !value)}>
              <Text style={styles.buttonText}>
                {enabled ? 'Stop' : 'Start'}
              </Text>
            </Pressable>
          </View>

          {error != null ? (
            <Text style={styles.error}>
              {error.code}: {error.message}
            </Text>
          ) : null}

          <View style={styles.grid}>
            <Metric label="Pressure" value={format(data, 'pressure')} />
            <Metric label="Altitude ASL" value={format(data, 'altitudeASL')} />
            <Metric label="Altitude (local)" value={format(data, 'altitude')} />
            <Metric
              label="Relative altitude"
              value={format(data, 'relativeAltitude')}
            />
            <Metric
              label="Vertical speed"
              value={format(data, 'verticalSpeed')}
            />
            <Metric label="Accuracy" value={format(data, 'accuracy')} />
            <Metric label="Timestamp" value={format(data, 'timestamp')} />
          </View>

          <Text style={styles.section}>Interval (ms)</Text>
          <View style={styles.chips}>
            {[50, 200, 500, 1000].map(ms => (
              <Pressable
                key={ms}
                style={[
                  styles.chip,
                  intervalMs === ms ? styles.chipActive : null,
                ]}
                onPress={() => setIntervalMs(ms)}>
                <Text
                  style={[
                    styles.chipText,
                    intervalMs === ms ? styles.chipTextActive : null,
                  ]}>
                  {ms}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Smoothing (EMA α)</Text>
          <View style={styles.chips}>
            {[0.1, 0.3, 0.6, 1].map(alpha => (
              <Pressable
                key={alpha}
                style={[
                  styles.chip,
                  smoothing === alpha ? styles.chipActive : null,
                ]}
                onPress={() => setSmoothing(alpha)}>
                <Text
                  style={[
                    styles.chipText,
                    smoothing === alpha ? styles.chipTextActive : null,
                  ]}>
                  {alpha}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>Local pressure (hPa)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={localPressure}
            onChangeText={setLocalPressure}
            placeholder="1013.25"
          />

          <Text style={styles.section}>Altitude reference (m)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={altitudeRef}
            onChangeText={setAltitudeRef}
            placeholder="e.g. airport elevation"
          />
          <Text style={styles.hint}>
            Setting an altitude reference calibrates local sea-level pressure
            from the latest sample (setAltitudeReference).
          </Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f3f6f8',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0b1f2a',
  },
  subtitle: {
    fontSize: 15,
    color: '#405764',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: '#0b1f2a',
  },
  button: {
    backgroundColor: '#8aa0ad',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonOn: {
    backgroundColor: '#0f6e8c',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#a12828',
    fontSize: 14,
  },
  grid: {
    gap: 8,
    marginTop: 4,
  },
  metric: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0f6e8c',
  },
  metricLabel: {
    fontSize: 12,
    color: '#607280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '600',
    color: '#0b1f2a',
    fontVariant: ['tabular-nums'],
  },
  section: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0b1f2a',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#d7e2e8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#0f6e8c',
  },
  chipText: {
    color: '#0b1f2a',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c5d3db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0b1f2a',
  },
  hint: {
    fontSize: 13,
    color: '#607280',
  },
});
