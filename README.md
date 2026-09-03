# react-native-barometer

Provides barometric and altitude information for React Native apps on iOS and Android.

> **New Architecture only (v2.0.0+)**  
> This library supports **only** the React Native New Architecture (Turbo Modules). It does **not** work with the legacy bridge. 

## Requirements (v2.0.0+)

- **React Native** `>=0.84` with **React 19**
- **New Architecture only** — not compatible with the legacy bridge
- **iOS** 15.1+
- **Android** API 24+ (minSdk 24)

Legacy bridge / React Native 0.59–0.83 apps should stay on **v1.x**.

## Getting started

```bash
yarn add react-native-barometer
# or
npm install react-native-barometer --save
```

### Installation

From **React Native 0.60** onward, [autolinking](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md) handles native setup.

**iOS:** run `pod install` in your `ios` directory after installing the package. The library ships a **podspec** (`react-native-barometer.podspec`); you do not need to add a manual `pod` line when using autolinking.

Add **Core Motion** usage text to your app’s `Info.plist` (required for `CMAltimeter` on iOS):

```xml
<key>NSMotionUsageDescription</key>
<string>Your explanation of why the app reads barometric pressure and altitude.</string>
```

**Android:** no extra steps beyond a clean rebuild.

### Example app

This repository includes an example app under [`example/`](example/) (React Native 0.87, New Architecture):

```bash
cd example
npm install
cd ios && bundle exec pod install && cd ..
npx react-native run-ios
# or
npx react-native run-android
```

The example exercises live `useBarometer` start/stop, interval presets, `resetRelativeAltitude()`, `getCurrentReading()`, authorization status, error banners, QNH calibration, and `getAltitude()`.

## Usage

Call `isSupported()` before watching on devices where a barometer may be absent.

### Hook

```tsx
import {useBarometer} from 'react-native-barometer';

function PressureLabel() {
  const {payload, error, supported, start, stop} = useBarometer({
    autoStart: true,
    interval: 200,
  });

  if (supported === false) {
    return null;
  }
  if (error) {
    return <Text>{error.message}</Text>;
  }
  return <Text>{payload?.pressure.toFixed(2)} hPa</Text>;
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
| `altitude` | Altitude in metres using `setLocalPressure()` as sea-level reference |
| `relativeAltitude` | Change since observing started, or since the last `resetRelativeAltitude()` |
| `verticalSpeed` | Rate of change of `altitudeASL` over the emit interval (m/s), zero on the first sample |

`setInterval(ms)` is clamped to a minimum of **`MIN_INTERVAL_MS` (50)**. Default is **`DEFAULT_INTERVAL_MS` (200)**. `setLocalPressure(hPa)` ignores non-positive values and falls back to `STANDARD_PRESSURE_HPA` (1013.25).

TypeScript types ship as `lib/index.d.ts`. React Native codegen still reads the specs in `src/`.

Interval is an emit throttle (and Android sampling hint). Changing it does **not** reset relative altitude. iOS relative altitude still resets if Core Motion is restarted, including when the app returns from background.

## Methods

### Summary

* [`isSupported`](#issupported)
* [`getAuthorizationStatus`](#getauthorizationstatus)
* [`setInterval`](#setinterval)
* [`setLocalPressure`](#setlocalpressure)
* [`resetRelativeAltitude`](#resetrelativealtitude)
* [`getCurrentReading`](#getcurrentreading)
* [`watch`](#watch)
* [`clearWatch`](#clearwatch)
* [`stopObserving`](#stopobserving)
* [`useBarometer`](#usebarometer)
* [`getAltitude`](#getaltitude)

---

### Details

#### `isSupported()`

Before using, check to see if barometric updates are supported on the device.

```javascript
const isSupported = await Barometer.isSupported();
```

On iOS this is `CMAltimeter.isRelativeAltitudeAvailable`. Motion permission can still be denied — see `getAuthorizationStatus()`.

---

#### `getAuthorizationStatus()`

```javascript
const status = await Barometer.getAuthorizationStatus();
// 'notDetermined' | 'denied' | 'restricted' | 'authorized'
```

On iOS this maps `CMAltimeter.authorizationStatus`. Android has no barometer permission and always returns `'authorized'`.

---

#### `setInterval()`

Optionally request an update interval in ms. The default update rate is (approx) 200ms, i.e. 5Hz.

```javascript
import {DEFAULT_INTERVAL_MS, MIN_INTERVAL_MS} from 'react-native-barometer';

Barometer.setInterval(1000);
```

---

#### `setLocalPressure()`

The altitude event contains two altitudes. The first is the standard atmosphere altitude based upon the standard atmospheric pressure of 1013.25hPa. The second is an altitude based upon a pressure that you can configure. You typically use this to calibrate the altitude to a reference altitude, for example the field elevation of an airport.

```javascript
Barometer.setLocalPressure(985);
```

---

#### `resetRelativeAltitude()`

Sets the current altitude as the zero point for `relativeAltitude` without stopping the sensor.

```javascript
Barometer.resetRelativeAltitude();
```

---

#### `getCurrentReading()`

Starts observing if needed, resolves with the next payload, then removes that one-shot watch.

```javascript
const payload = await Barometer.getCurrentReading();
```

---

#### `watch()`

```javascript
Barometer.watch(success, error);
```

Invokes the success callback whenever the pressure or altitude changes.
The optional error callback receives `{ code, message }`.

Fatal codes (`no_sensor`, `unauthorized`, `altimeter_error`) stop observing for every watcher. `unreliable` (Android accuracy) is reported but observing continues.

Returns a `watchId` (number).

**Parameters:**

| Name    | Type     | Required | Description |
| ------- | -------- | -------- | ----------- |
| success | function | Yes      | Invoked at a default interval of 5Hz. Change with `setInterval`. |
| error   | function | No       | Invoked when the native layer reports an error. |

**Example:**

```javascript
const watchId = Barometer.watch(
  payload => {
    console.log(payload.pressure, payload.relativeAltitude);
  },
  error => {
    console.warn(error.code, error.message);
  },
);
```

---

#### `clearWatch()`

```javascript
Barometer.clearWatch(watchID);
```

**Parameters:**

| Name    | Type   | Required | Description                    |
| ------- | ------ | -------- | ------------------------------ |
| watchID | number | Yes      | Id as returned by `watch()`.   |

---

#### `stopObserving()`

```javascript
Barometer.stopObserving();
```

Stops observing for all barometric updates and removes every listener.

Updates are paused while the app is in the background and resume on foreground if observing is still requested.

---

#### `useBarometer()`

React hook over the same singleton as `watch()`.

```ts
const {
  payload,
  error,
  supported,
  authorizationStatus,
  observing,
  start,
  stop,
} = useBarometer({autoStart: true, interval: 200});
```

`autoStart` defaults to `true` and only starts when `isSupported()` is true. Unmount calls `clearWatch`.

---

#### `getAltitude()`

Pure helper for the same barometric formula used natively:

```javascript
import {getAltitude, STANDARD_PRESSURE_HPA} from 'react-native-barometer';

const metres = getAltitude(STANDARD_PRESSURE_HPA, 1000);
```
