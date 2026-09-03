# Migrating to v2 / v2.1

## Legacy bridge apps (RN 0.59–0.83)

Stay on **v1.x**. v2+ requires the **New Architecture** (Turbo Modules) and does not load on the legacy bridge.

## v1 → v2.0

1. Enable New Architecture in your app (RN 0.84+ recommended).
2. Upgrade to `react-native-barometer@2`.
3. Rebuild native apps (`pod install`, clean Android build).
4. Keep calling `isSupported()` before `watch()` — some devices and simulators have no barometer.

### Breaking changes in v2.0
- Legacy bridge is not supported
- Peer range targets modern RN + React 19

## v2.0 → v2.1

Mostly additive. Recommended updates:

```diff
- import Barometer from 'react-native-barometer';
+ import Barometer, {useBarometer} from 'react-native-barometer';

  const id = Barometer.watch(payload => {
    console.log(payload.pressure);
- });
+ }, error => {
+   console.warn(error.code, error.message);
+ });
```

- `BarometerPayload` now includes `accuracy` (number; `-1` when unknown)
- Import paths resolve through `exports` → `lib/`; no code change needed for default imports
- If you previously relied on a hard crash when the native module was missing, handle `isSupported() === false` or `watch() === -1` instead
