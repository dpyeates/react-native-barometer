// RNBarometer.m
#import "RNBarometer.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

const double STANDARD_ATMOSPHERE = 1013.25;
const long DEFAULT_INTERVAL_MS = 0.7;  //  5 Hz
const double DEFAULT_SMOOTHING_FACTOR = 0.7;

@implementation RNBarometer

RCT_EXPORT_MODULE()

- (id) init {
  self = [super init];
  if (self) {
    altimeter = [[CMAltimeter alloc] init];
    altimeterQueue = [[NSOperationQueue alloc] init];
    [altimeterQueue setName:@"DeviceAltitude"];
    [altimeterQueue setMaxConcurrentOperationCount:1];
    localPressurehPa = STANDARD_ATMOSPHERE;
    rawPressure = 0;
    altitudeASL = 0;
    lastSampleTime = 0;
    intervalMillis = DEFAULT_INTERVAL_MS;
    isRunning = false;
    smoothingFactor = DEFAULT_SMOOTHING_FACTOR;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"barometerUpdate"];
}

// Called to determine if this device is capable of providing barometer updates
RCT_REMAP_METHOD(isSupported,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@([CMAltimeter isRelativeAltitudeAvailable]));
}

// Sets the interval between event samples
RCT_EXPORT_METHOD(setInterval:(NSInteger) interval) {
  intervalMillis = interval;
  bool shouldStart = isRunning;
  [self stopObserving];
  if(shouldStart) {
    [self startObserving];
  }
}

// Sets the local pressure in hectopascals
RCT_EXPORT_METHOD(setLocalPressure:(NSInteger) pressurehPa) {
  localPressurehPa = pressurehPa;
}

// Sets smoothing factor [0 -1].
// Note: More smoothing means more latency before
// the smoothed value has "caught up with" current
// conditions.
RCT_EXPORT_METHOD(setSmoothingFactor:(double) smoothingFactor) {
  if (smoothingFactor >= 0 && smoothingFactor <= 1.0) {
    self->smoothingFactor = smoothingFactor;
  }
}

// Get the smoothing factor
RCT_EXPORT_METHOD(getSmoothingFactor,
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  return resolve(self->smoothingFactor);
}


// Starts observing pressure
RCT_EXPORT_METHOD(startObserving) {
  if(!isRunning) {
    [altimeter startRelativeAltitudeUpdatesToQueue:altimeterQueue withHandler:^(CMAltitudeData * _Nullable altitudeData, NSError * _Nullable error) {
      NSLog(@"startRelativeAltitudeUpdatesToQueue()");
      long long tempMs = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
      long long timeSinceLastUpdate = (tempMs - self->lastSampleTime);
      NSLog(@"  tempMs: %lld", tempMs);
      NSLog(@"  self->lastSampleTime: %lld", self->lastSampleTime);
      NSLog(@"  timeSinceLastUpdate: %lld", timeSinceLastUpdate);
      if (altitudeData && (timeSinceLastUpdate >= self->intervalMillis)) {
        double lastAltitudeASL = self->altitudeASL;
        // Get the raw pressure in millibar/hPa
        double newRawPressure = altitudeData.pressure.doubleValue * 10.0; // the x10 converts to millibar
        // Apply any smoothing
        self->rawPressure = (newRawPressure * (((double)1.0) - self->smoothingFactor) + self->rawPressure * self->smoothingFactor);
        // Calculate standard atmpsphere altitude in metres
        self->altitudeASL = getAltitude(STANDARD_ATMOSPHERE, self->rawPressure);
        // Calculate our vertical speed in metres per second
        double verticalSpeed = ((self->altitudeASL - lastAltitudeASL) / timeSinceLastUpdate) * 1000;
        // Calculate our altitude based on our local pressure
        self->altitude = getAltitude(self->localPressurehPa, self->rawPressure);
        // Send change events to the Javascript side via the React Native bridge
        [self sendEventWithName:@"barometerUpdate" body:@{
          @"timestamp": @(tempMs),
          @"pressure": @(self->rawPressure),
          @"altitudeASL": @(self->altitudeASL),
          @"altitude": @(self->altitude),
          @"relativeAltitude": @(altitudeData.relativeAltitude.longValue),
          @"verticalSpeed": @(verticalSpeed)
        }
         ];
      }
      self->lastSampleTime = tempMs;
    }];

    isRunning = true;
  }
}

// Stops observing pressure
RCT_EXPORT_METHOD(stopObserving) {
  [altimeter stopRelativeAltitudeUpdates];
  rawPressure = 0;
  altitudeASL = 0;
  altitude = 0;
  lastSampleTime = 0;
  isRunning = false;
}

// Computes the Altitude in meters from the atmospheric pressure and the pressure at sea level.
// p0 pressure at sea level
// p atmospheric pressure
// returns an altitude in meters
double getAltitude(double p0, double p)
{
  const double coef = 1.0 / 5.255;
  return 44330.0 * (1.0 - pow(p/p0, coef));
}


@end

