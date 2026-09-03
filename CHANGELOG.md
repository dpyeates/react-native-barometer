# Changelog

## 2.1.0

- Report native failures through `onBarometerError` and an optional `watch(success, error)` callback (`no_sensor`, `unauthorized`, `altimeter_error`, `unreliable`).
- Add `getAuthorizationStatus()`, `resetRelativeAltitude()`, `getCurrentReading()`, `useBarometer()`, and `getAltitude()`.
- Convert the public API to TypeScript and ship compiled CommonJS from `lib/`. Changing `setInterval` no longer resets relative altitude.
