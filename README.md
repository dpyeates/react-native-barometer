# react-native-barometer

Provides barometric and altitude information for React Native apps on iOS and Android.

> **New Architecture only (v2.0.0+)**  
> This library supports **only** the React Native New Architecture (Turbo Modules). It does **not** work with the legacy bridge. 

## Requirements (v2.0.0+)

- **React Native** `>=0.84 <0.86` with **React 19**
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

This repository includes an example app under [`example/`](example/) (React Native 0.85, New Architecture):

```bash
cd example
npm install
cd ios && bundle exec pod install && cd ..
npx react-native run-ios
# or
npx react-native run-android
```

## Usage

Call `isSupported()` before `watch()` on devices where a barometer may be absent.

### Example

```javascript
import Barometer, {STANDARD_PRESSURE_HPA} from 'react-native-barometer';

const supported = await Barometer.isSupported();
if (supported) {
  const watchId = Barometer.watch(payload => {
    console.log(payload.pressure, payload.relativeAltitude);
  });
}
```

### Payload fields

| Field | Description |
| ----- | ----------- |
| `timestamp` | Sample time (ms since Unix epoch) |
| `pressure` | Filtered air pressure in hPa (EMA-smoothed on both platforms) |
| `altitudeASL` | Altitude in metres from the standard atmosphere (1013.25 hPa) |
| `altitude` | Altitude in metres using `setLocalPressure()` as sea-level reference |
| `relativeAltitude` | Change since observing started — Core Motion on iOS; computed baseline on Android |
| `verticalSpeed` | Rate of change of `altitudeASL` over the emit interval (m/s), zero on the first sample |

`setInterval(ms)` is clamped to a minimum of **50 ms**. `setLocalPressure(hPa)` ignores non-positive values and falls back to 1013.25 hPa.

TypeScript types are available via `index.d.ts` (`BarometerPayload`, etc.).

## Methods

### Summary

* [`isSupported`](#issupported)
* [`setInterval`](#setinterval)
* [`setLocalPressure`](#setlocalpressure)
* [`watch`](#watch)
* [`clearWatch`](#clearwatch)
* [`stopObserving`](#stopobserving)

---

### Details

#### `isSupported()`

Before using, check to see if barometric updates are supported on the device.

```javascript
const isSupported = await Barometer.isSupported();
```

---

#### `setInterval()`

Optionally request an update interval in ms. The default update rate is (approx) 200ms, i.e. 5Hz.

```javascript
// request updates once every second
Barometer.setInterval(1000);
```

---

#### `setLocalPressure()`

The altitude event contains two altitudes. The first is the standard atmosphere altitude based upon the standard atmospheric pressure of 1013.25hPa. The second is an altitude based upon a pressure that you can configure. You typically use this to calibrate the altitude to a reference altitude, for example the field elevation of an airport.

```javascript
// set the local pressure to 985hPa
Barometer.setLocalPressure(985);
```

---

#### `watch()`

```javascript
Barometer.watch(success);
```

Invokes the success callback whenever the pressure or altitude changes.
The payload delivered via the callback is defined in the example below.

Returns a `watchId` (number).

**Parameters:**

| Name    | Type     | Required | Description |
| ------- | -------- | -------- | ----------- |
| success | function | Yes      | Invoked at a default interval of 5hz. This can be changed by using the setInterval method. |

**Example:**

```javascript
const watchId = Barometer.watch(payload => {
  /*
  payload.timestamp - sample time in ms referenced to January 1, 1970 UTC
  payload.pressure - current air pressure in hPa
  payload.altitudeASL - altitude in metres based upon standard atmosphere
  payload.altitude - altitude in metres based upon the local pressure
  payload.relativeAltitude - change since observing started (see table above).
  payload.verticalSpeed - change in altitudeASL over the emit interval (m/s)
  */
});
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

Stops observing for all barometric updates.

In addition, it removes all listeners previously registered.

Note that this method does nothing if the `Barometer.watch(successCallback)` method has not previously been called.
