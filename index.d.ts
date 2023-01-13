// Module d.ts file; enables using this module
// in typescript react-native projects

// See:
// https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html
// https://stackoverflow.com/a/51355583

declare module "react-native-barometer";

interface BarometerPayload {  // See README for descriptions
  timestamp:number,
  pressure:number,
  altitudeASL:number,
  altitude:number,
  relativeAltitude:number,
  verticalSpeed:number,
};

type WatchCallbackFn = (payload:BarometerPayload) => number;

interface IBarometer {
  watch: (watchCallbackFn:WatchCallbackFn) => number,
  clearWatch: (watchID:number) => void,
  stopObserving: () => void,
  isSupported: () => Promise<boolean>,
  setInterval: (interval:number) => void,
  setLocalPressure: (pressure:number) => void,
};

declare const Barometer:IBarometer;

export {
  Barometer,
  BarometerPayload
};

export default Barometer;