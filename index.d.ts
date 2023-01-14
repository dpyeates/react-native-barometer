// Module d.ts file

// Enables using module in typescript react-native projects,
// with editor auto-complete and type-validation (in VS Code)

// See:
// Typescript docs:
//   https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html
// Typescript Playground, for automatic generation of .d.ts file from .js:
//   https://www.typescriptlang.org/play?filetype=js&useJavaScript=true#code/Q
// Simplest approach:
// https://stackoverflow.com/a/51355583

declare module "react-native-barometer";

interface BarometerPayload {  // See module README for field descriptions
  timestamp:number,
  pressure:number,
  altitudeASL:number,
  altitude:number,
  relativeAltitude:number,
  verticalSpeed:number,
};

type BarometerWatchCallbackFn = (payload:BarometerPayload) => void;

declare namespace Barometer {  // See module README for function descriptions
  function isSupported(): Promise<boolean>;
  function setInterval(interval: number): void;
  function setLocalPressure(pressure: number): void;
  function watch(success: BarometerWatchCallbackFn): number;
  function clearWatch(watchID: any): void;
  function stopObserving(): void;
  function setSmoothingFactor(smoothingFactor:double): void;
  function getSmoothingFactor(): Promise<double>;
}

export {
  BarometerPayload,
  BarometerWatchCallbackFn
};

export default Barometer;
