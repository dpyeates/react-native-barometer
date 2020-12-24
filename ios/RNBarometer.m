// RNBarometer.m
#import "RNBarometer.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

const double STANDARD_ATMOSPHERE = 1013.25;

@implementation RNBarometer

RCT_EXPORT_MODULE()

- (id) init {
    self = [super init];
    if (self) {
        altimeter = [[CMAltimeter alloc] init];
        isSupported = [CMAltimeter isRelativeAltitudeAvailable];
        altimeterQueue = [[NSOperationQueue alloc] init];
        [altimeterQueue setName:@"DeviceAltitude"];
        [altimeterQueue setMaxConcurrentOperationCount:1];
        localPressurehPa = STANDARD_ATMOSPHERE;
        rawPressure = 0;
        altitudeASL = 0;
        lastSampleTime = 0;
        intervalMillis = 200; // 5Hz
        observing = false;
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
    resolve(@(isSupported));
}

// Sets the interval between event samples
RCT_EXPORT_METHOD(setInterval:(NSInteger) interval) {
  intervalMillis = interval;
}

// Sets the local pressure in hectopascals
RCT_EXPORT_METHOD(setLocalPressure:(NSInteger) pressurehPa) {
  localPressurehPa = pressurehPa;
}

// Starts observing pressure
RCT_EXPORT_METHOD(startObserving) {
  if(!observing) {
       [altimeter startRelativeAltitudeUpdatesToQueue:altimeterQueue withHandler:^(CMAltitudeData * _Nullable altitudeData, NSError * _Nullable error) {
           long long tempMs = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
           long long timeSinceLastUpdate = (tempMs - self->lastSampleTime);
           if(timeSinceLastUpdate >= self->intervalMillis && altitudeData){
               double lastAltitudeASL = self->altitudeASL;
               // Get the raw pressure in millibar/hPa
               self->rawPressure = altitudeData.pressure.doubleValue * 10.0; // the x10 converts to millibar
               // Calculate standard atmpsphere altitude in metres
               self->altitudeASL = getAltitude(STANDARD_ATMOSPHERE, self->rawPressure);
               // Calculate our vertical speed in metres per second
               double verticalSpeed = ((self->altitudeASL - lastAltitudeASL) / timeSinceLastUpdate) * 1000;
               // Calculate our altitude based on our local pressure
               self->altitude = getAltitude(self->localPressurehPa, self->rawPressure);
               // Get the relative altitude
               double relativeAltitude = altitudeData.relativeAltitude.longValue;
               // Send change events to the Javascript side via the React Native bridge 
               [self sendEventWithName:@"barometerUpdate" body:@{
                                                                @"timestamp": @(tempMs),
                                                                @"pressure": @(self->rawPressure),
                                                                @"altitudeASL": @(self->altitudeASL),
                                                                @"altitude": @(self->altitude),
                                                                @"relativeAltitude": @(relativeAltitude),
                                                                @"verticalSpeed": @(verticalSpeed)
                                                                }
                ];
           }
           self->lastSampleTime = tempMs;
       }];
       observing = true;
   }
}

// Stops observing pressure
RCT_EXPORT_METHOD(stopObserving) {
   [altimeter stopRelativeAltitudeUpdates];
   rawPressure = 0;
   altitudeASL = 0;
   altitude = 0;
   lastSampleTime = 0;
   observing = false;
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

