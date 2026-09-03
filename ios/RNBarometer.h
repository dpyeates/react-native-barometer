#import <RNBarometerSpec/RNBarometerSpec.h>
#import <CoreMotion/CoreMotion.h>

@interface RNBarometer : NativeRNBarometerSpecBase <NativeRNBarometerSpec> {
  CMAltimeter *altimeter;
  NSOperationQueue *altimeterQueue;
  BOOL wantsObserving;
  BOOL isRunning;
  NSInteger intervalMillis;
  long long lastEmitTime;
  double localPressurehPa;
  double filteredPressure;
  double altitudeASL;
  double altitude;
  double relativeAltitudeOffset;
  double lastRelativeAltitudeRaw;
}

@end
