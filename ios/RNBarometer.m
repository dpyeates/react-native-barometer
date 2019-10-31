// RNBarometer.m
#import "RNBarometer.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

@implementation RNBarometer

RCT_EXPORT_MODULE()

- (id) init {
    self = [super init];
    if (self) {
        self->altimeter = [[CMAltimeter alloc] init];
        self->altimeterQueue = [[NSOperationQueue alloc] init];
        [self->altimeterQueue setName:@"DeviceAltitude"];
        [self->altimeterQueue setMaxConcurrentOperationCount:1];
        self->localPressurehPa = PRESSURE_STANDARD_ATMOSPHERE;
        self->rawPressure = 0;
        self->altitudeASL = 0;
        self->lastSampleTime = 0;
        self->intervalMillis = 200;
        self->observing = false;
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
	resolve([CMAltimeter isRelativeAltitudeAvailable] ? @YES : @NO)
}

// Sets the interval between event samples
RCT_REMAP_METHOD(setInterval:(NSInteger) interval)) {
	self->intervalMillis = interval;
}

// Sets the local pressure in hectopascals
RCT_REMAP_METHOD(setLocalPressure:(NSInteger) pressurehPa)) {
	self->localPressurehPa = pressurehPa;
}

// Starts observing pressure
RCT_EXPORT_METHOD(startObserving) {
	if(!self->observing) {
       [self->altimeter startRelativeAltitudeUpdatesToQueue:self->altimeterQueue withHandler:^(CMAltitudeData * _Nullable altitudeData, NSError * _Nullable error) {
           long long tempMs = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
           long timeSinceLastUpdate = (tempMs - self->lastSampleTime);
           if(timeSinceLastUpdate >= self->intervalMillis && altitudeData){
           	   // Get the raw pressure in millibar/hPa
               self->rawPressure = altitudeData.pressure.doubleValue * 10.0; // the x10 converts to millibar
               // Calculate standard atmpsphere altitude in metres
               self->altitudeASL = getAltitude(PRESSURE_STANDARD_ATMOSPHERE, self->rawPressure);
               // Calculate our vertical speed in metres per second
               float verticalSpeed = ((self->altitudeASL - self->lastAltitudeASL) / timeSinceLastUpdate) * 1000;
               // Calculate our altitude based on our local pressure
               self->altitude = getAltitude(self->localPressurehPa, self->rawPressure);
               // Get the relative altitude
               self->relativeAltitude = altitudeData.relativeAltitude.longValue;
               // Send change events to the Javascript side via the React Native bridge 
               [self sendEventWithName:@"barometerUpdate" body:@{
                                                                @"timestamp": @(tempMs),
                                                                @"pressure": @(self->rawPressure),
                                                                @"altitudeASL": @(self->altitudeASL),
                                                                @"altitude": @(self->altitude),
                                                                @"relativeAltitude": @(self->relativeAltitude),
                                                                @"verticalSpeed": @(verticalSpeed)
                                                                }
                ];
           }
           self->lastSampleTime = tempMs;
       }];
       self->observing = true;
   }
}

// Stops observing pressure
RCT_EXPORT_METHOD(stopObserving) {
   [self->altimeter stopRelativeAltitudeUpdates];
   self->rawPressure = 0;
   self->altitudeASL = 0;
   self->altitude = 0;
   self->lastSampleTime = 0;
   self->relativeAltitude = 0;
   self->initialAltitude = -1;
   self->observing = false;
}

// Computes the Altitude in meters from the atmospheric pressure and the pressure at sea level.
// p0 pressure at sea level
// p atmospheric pressure
// returns an altitude in meters
float getAltitude(float p0, float p)
{
  const float coef = 1.0 / 5.255;
  return 44330.0 * (1.0 - (float)pow(p/p0, coef));
}

@end
