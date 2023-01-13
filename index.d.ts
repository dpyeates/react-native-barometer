// Module d.ts file; enables using this module
// in typescript react-native projects

// See:
// https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html
// https://stackoverflow.com/a/51355583

// declare module "react-native-barometer";

// import Barometer from ".";

// interface BarometerPayload {  // See README for field descriptions
//   timestamp:number,
//   pressure:number,
//   altitudeASL:number,
//   altitude:number,
//   relativeAltitude:number,
//   verticalSpeed:number,
// };

// type WatchCallbackFn = (payload:BarometerPayload) => void;

// interface IBarometer {
//   watch: (watchCallbackFn:WatchCallbackFn) => number,
//   clearWatch: (watchID:number) => void,
//   stopObserving: () => void,
//   isSupported: () => Promise<boolean>,
//   setInterval: (interval:number) => void,
//   setLocalPressure: (pressure:number) => void,
// };

// declare const Barometer:IBarometer;

// export {
//   Barometer,
//   BarometerPayload,
//   WatchCallbackFn
// };

// export default Barometer;

declare module "react-native-barometer";

interface BarometerPayload {  // See README for field descriptions
  timestamp:number,
  pressure:number,
  altitudeASL:number,
  altitude:number,
  relativeAltitude:number,
  verticalSpeed:number,
};

type BarometerWatchCallbackFn = (payload:BarometerPayload) => void;

export default Barometer;
declare namespace Barometer {
    function watch(success: BarometerWatchCallbackFn): number;
    function clearWatch(watchID: any): void;
    function stopObserving(): void;
    function isSupported(): Promise<any>;
    function setInterval(interval: any): void;
    function setLocalPressure(pressure: any): void;
}