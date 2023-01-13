// Module d.ts file; enables this module to be used
// in typescript react-native projects

// If keeping the interface below up-to-date proves
// to be a nuissance, options are:
//
// * Comment out everything below except the "declare module..." line
//   (which enables this module to be used in typescript
//   react-native projects). Cons: You lose auto-complete and 
//   type-checking in VS Code, but, if the types defined by 
//   the interface below aren't there - they can't be *wrong*.
// 
// * Re-create this module using create-react-native-library,
//   choosing typescript, and java/obj-c. See:
//   https://reactnative.dev/docs/native-modules-setup,
//  

// See:
// https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html
// https://stackoverflow.com/a/51355583

declare module "react-native-barometer";

interface Payload {  // See README for descriptions
  timestamp:number,
  pressure:number,
  altitudeASL:number,
  altitude:number,
  relativeAltitude:number,
  verticalSpeed:number,
};

type WatchCallbackFn = (payload:Payload) => number;

interface IBarometer {
  watch: WatchCallbackFn,
  clearWatch: (watchID:number) => void,
  stopObserving: () => void,
  isSupported: () => Promise<boolean>,
  setInterval: (interval:number) => void,
  setLocalPressure: (pressure:number) => void,
};

declare const Barometer:IBarometer;

export {
  Barometer
};

export default Barometer;