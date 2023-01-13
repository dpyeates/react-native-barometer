//import Barometer from "."

declare module "react-native-barometer";

interface IBarometer {
  watch: (watchCallbackFn:Function) => number,
  clearWatch: (watchID:number) => void,
  stopObserving: () => void,
  isSupported: () => Promise<boolean>,
  setInterval: (interval:number) => void,
  setLocalPressure: (pressure:number) => void,
}

declare const Barometer:IBarometer;
export default Barometer;