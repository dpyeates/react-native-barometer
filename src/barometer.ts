import NativeRNBarometer from './NativeRNBarometer';
import {createBarometer} from './createBarometer';

const Barometer = createBarometer(NativeRNBarometer);

export default Barometer;
