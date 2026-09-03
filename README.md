# react-native-barometer

Provides barometric and altitude information for React Native apps on iOS and Android.

> **New Architecture only (v2.0.0+)**  
> This library supports **only** the React Native New Architecture (Turbo Modules). It does **not** work with the legacy bridge.

## Requirements (v2.1.0+)

- **React Native** `>= 0.84` with the **New Architecture** enabled
- **React** 19+ recommended (peer: `*`)
- **iOS** 15.1+
- **Android** API 24+ (minSdk 24)

Legacy bridge / React Native 0.59–0.83 apps should stay on **v1.x**. See [MIGRATION.md](./MIGRATION.md).

## Getting started

```bash
yarn add react-native-barometer
# or
npm install react-native-barometer --save
```

### Installation

Autolinking handles native setup on modern React Native.

**iOS:** run `pod install` in your `ios` directory after installing the package.

Add **Core Motion** usage text to your app’s `Info.plist` (required for `CMAltimeter` on iOS):

```xml
<key>NSMotionUsageDescription</key>
<string>Your explanation of why the app reads barometric pressure and altitude.</string>
```

**Android:** no extra steps beyond a clean rebuild.

### Expo

This module uses native device APIs and is **not** available in Expo Go. It works with **Expo Dev Client** / **prebuild** continuous native generation when New Architecture is enabled. After adding the dependency, regenerate native projects (`npx expo prebuild`) and rebuild the dev client.

### Example app

This repository includes an example app under [`example/`](example/) (React Native 0.86, New Architecture):

```bash
cd example
npm install
cd ios && bundle exec pod install && cd ..
npx react-native run-ios
# or
npx react-native run-android
```

## Usage

Call `isSupported()` before `watch()` on devices where a barometer may be absent. If the native module is not linked, `isSupported()` resolves to `false` and `watch()` returns `-1` without crashing.

### Hook (recommended)

```javascript
import {useBarometer} from 'react-native-barometer';

function PressureReadout() {
  const {supported, data, error} = useBarometer({
    interval: 200,
    smoothing: 0.3,
  });

  if (supported === false) {
    return null;
  }
  if (error) {
    console.warn(error.code, error.message);
  }
  return data ? `${data.pressure.toFixed(1)} hPa` : '…';
}
```

### Imperative API

```javascript
import Barometer, {STANDARD_PRESSURE_HPA} from 'react-native-barometer';

const supported = await Barometer.isSupported();
if (supported) {
  const watchId = Barometer.watch(
    payload => {
      console.log(payload.pressure, payload.relativeAltitude);
    },
    error => {
      console.warn(error.code, error.message);
    },
  );
}
```

### Payload fields

| Field | Description |
| ----- | ----------- |
| `timestamp` | Sample time (ms since Unix epoch) |
| `pressure` | Filtered air pressure in hPa (EMA-smoothed on both platforms) |
| `altitudeASL` | Altitude in metres from the standard atmosphere (1013.25 hPa) |
| `altitude` | Altitude in metres using `setLocalPressure()` / `setAltitudeReference()` as sea-level reference |
| `relativeAltitude` | Change since observing started — Core Motion on iOS; computed baseline on Android |
| `verticalSpeed` | Rate of change of `altitudeASL` over the emit interval (m/s), zero on the first sample |
| `accuracy` | Android `SENSOR_STATUS_*` value; `-1` on iOS / unknown |

`setInterval(ms)` is clamped to a minimum of **50 ms**. `setLocalPressure(hPa)` ignores non-positive values and falls back to 1013.25 hPa. `setSmoothing(alpha)` clamps to `(0.01, 1]` (`1` = raw pressure).

### Background behavior

Observing **pauses while the app is backgrounded** (iOS notification observers / Android host lifecycle) and resumes on foreground when a watch is still active. This is intentional for battery and platform policy. Some OEMs further restrict background sensors.

### Platform notes

- **Relative altitude:** iOS uses Core Motion’s relative altitude; Android subtracts an ASL baseline captured when observing starts. Call `resetRelativeAltitude()` to zero the baseline again (Android) or restart the altimeter session (iOS).
- **Errors:** fatal native failures emit `onBarometerError` and stop native observing. Clear watches or toggle your hook’s `enabled` flag before starting again.

## Methods

### Summary

* [`isSupported`](#issupported)
* [`setInterval`](#setinterval)
* [`setLocalPressure`](#setlocalpressure)
* [`setSmoothing`](#setsmoothing)
* [`setAltitudeReference`](#setaltitudereference)
* [`resetRelativeAltitude`](#resetrelativealtitude)
* [`watch`](#watch)
* [`clearWatch`](#clearwatch)
* [`stopObserving`](#stopobserving)
* [`useBarometer`](#usebarometer)
* [`getAltitude` / `pressureFromAltitude`](#helpers)

---

### Details

#### `isSupported()`

```javascript
const isSupported = await Barometer.isSupported();
```

Returns `false` when the device has no barometer **or** the native module is unavailable.

---

#### `setInterval()`

Optionally request an update interval in ms. The default update rate is (approx) 200ms, i.e. 5Hz. Android rates are best-effort.

```javascript
Barometer.setInterval(1000);
```

---

#### `setLocalPressure()`

Calibrate altitude using a known sea-level pressure (hPa), for example from a METAR.

```javascript
Barometer.setLocalPressure(985);
```

---

#### `setSmoothing()`

EMA factor for pressure smoothing. Default `0.3`. Use `1` for raw samples.

```javascript
Barometer.setSmoothing(0.5);
```

---

#### `setAltitudeReference()`

Calibrate local sea-level pressure from a **known altitude in metres** (e.g. field elevation) and the latest pressure sample. If no sample exists yet, the value is applied on the next reading.

```javascript
Barometer.setAltitudeReference(120);
```

---

#### `resetRelativeAltitude()`

Resets relative altitude to zero on the next sample.

```javascript
Barometer.resetRelativeAltitude();
```

---

#### `watch()`

```javascript
const watchId = Barometer.watch(success, onError?);
```

Invokes `success` whenever pressure/altitude updates. Optional `onError` receives `{ code, message }` when the native sensor fails. Returns a numeric `watchId`, or `-1` if the native module is missing.

---

#### `clearWatch()` / `stopObserving()`

```javascript
Barometer.clearWatch(watchId);
Barometer.stopObserving(); // removes all watches and stops native updates
```

---

#### `useBarometer()`

```javascript
const {supported, data, error} = useBarometer({
  enabled: true,
  interval: 200,
  localPressure: 1013.25,
  smoothing: 0.3,
  altitudeReference: 120,
  onError: err => console.warn(err),
});
```

---

#### Helpers

```javascript
import {getAltitude, pressureFromAltitude, STANDARD_PRESSURE_HPA} from 'react-native-barometer';

const metres = getAltitude(STANDARD_PRESSURE_HPA, 980);
const p0 = pressureFromAltitude(120, 980);
```

## License

MIT — see [LICENSE](./LICENSE).
