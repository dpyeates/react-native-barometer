# Changelog

## 2.1.0

### Enhancements
- Soft-fail when the Turbo Module is missing (`isSupported()` → `false`, `watch()` → `-1`) instead of crashing AppRegistry
- Surface native sensor failures via `onBarometerError` / the optional `watch` error callback
- Add `useBarometer()` React hook with automatic subscribe/cleanup
- Add `setSmoothing(alpha)` for configurable EMA filtering
- Add `setAltitudeReference(metres)` to calibrate local pressure from a known altitude
- Add `resetRelativeAltitude()`
- Export `getAltitude` / `pressureFromAltitude` helpers
- Include `accuracy` on the payload (Android sensor accuracy; `-1` on iOS)
- Monotonic watch IDs (no sparse-array holes)
- TypeScript source compiled to `lib/` with package `exports`
- Restore in-repo example app (RN 0.86, New Architecture)
- GitHub Actions CI (typecheck + unit tests + example install)
- Widen peer dependency to `react-native >= 0.84` (no upper bound)

### Docs
- README updated for the new API, Expo notes, background behavior, and migration
- Added `CHANGELOG.md` and `MIGRATION.md`

## 2.0.0

- New Architecture only (Turbo Modules)
- Kotlin Android module and Obj-C++ iOS module
- Shared JS validation helpers and unit tests
