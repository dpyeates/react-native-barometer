# Barometer example

React Native **0.86** app (New Architecture) that exercises `react-native-barometer`.

## Run

```bash
cd example
npm install
cd ios && bundle exec pod install && cd ..
npx react-native run-ios
# or
npx react-native run-android
```

The example depends on the parent package via `"react-native-barometer": "file:.."`.
