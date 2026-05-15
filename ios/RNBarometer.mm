#import "RNBarometer.h"
#import <UIKit/UIKit.h>

static const double STANDARD_ATMOSPHERE = 1013.25;
static const double PRESS_FILTERING_FACTOR = 0.3;
static const NSInteger MIN_INTERVAL_MS = 50;

static double getAltitude(double p0, double p) {
  const double coef = 1.0 / 5.255;
  return 44330.0 * (1.0 - pow(p / p0, coef));
}

static NSInteger clampIntervalMillis(double interval) {
  NSInteger ms = (NSInteger)interval;
  if (ms < MIN_INTERVAL_MS) {
    return MIN_INTERVAL_MS;
  }
  return ms;
}

@implementation RNBarometer

- (instancetype)init {
  self = [super init];
  if (self) {
    altimeter = [[CMAltimeter alloc] init];
    altimeterQueue = [[NSOperationQueue alloc] init];
    [altimeterQueue setName:@"DeviceAltitude"];
    [altimeterQueue setMaxConcurrentOperationCount:1];
    localPressurehPa = STANDARD_ATMOSPHERE;
    rawPressure = 0;
    altitudeASL = 0;
    lastEmitTime = 0;
    intervalMillis = 200;
    wantsObserving = NO;
    isRunning = NO;

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(handleAppDidEnterBackground)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(handleAppWillEnterForeground)
                   name:UIApplicationWillEnterForegroundNotification
                 object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleAppDidEnterBackground {
  if (wantsObserving && isRunning) {
    [self endAltimeterUpdates];
  }
}

- (void)handleAppWillEnterForeground {
  if (wantsObserving && !isRunning) {
    [self beginAltimeterUpdates];
  }
}

- (void)isSupported:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  resolve(@([CMAltimeter isRelativeAltitudeAvailable]));
}

- (void)setInterval:(double)interval {
  intervalMillis = clampIntervalMillis(interval);
  BOOL shouldStart = wantsObserving;
  [self endAltimeterUpdates];
  wantsObserving = shouldStart;
  if (shouldStart) {
    [self beginAltimeterUpdates];
  }
}

- (void)setLocalPressure:(double)pressurehPa {
  if (pressurehPa > 0) {
    localPressurehPa = pressurehPa;
  }
}

- (void)startObserving {
  wantsObserving = YES;
  [self beginAltimeterUpdates];
}

- (void)stopObserving {
  wantsObserving = NO;
  [self endAltimeterUpdates];
}

- (void)beginAltimeterUpdates {
  if (isRunning) {
    return;
  }

  __weak RNBarometer *weakSelf = self;
  [altimeter startRelativeAltitudeUpdatesToQueue:altimeterQueue
                                     withHandler:^(CMAltitudeData *_Nullable altitudeData, NSError *_Nullable error) {
                                       RNBarometer *strongSelf = weakSelf;
                                       if (strongSelf == nil) {
                                         return;
                                       }

                                       if (error != nil) {
                                         NSLog(@"RNBarometer: altimeter error: %@", error.localizedDescription);
                                         [strongSelf endAltimeterUpdates];
                                         strongSelf->wantsObserving = NO;
                                         return;
                                       }

                                       if (altitudeData == nil) {
                                         return;
                                       }

                                       long long tempMs = (long long)([[NSDate date] timeIntervalSince1970] * 1000.0);
                                       long long timeSinceLastEmit = tempMs - strongSelf->lastEmitTime;
                                       if (strongSelf->lastEmitTime > 0 &&
                                           timeSinceLastEmit < strongSelf->intervalMillis) {
                                         return;
                                       }

                                       double lastAltitudeASL = strongSelf->altitudeASL;
                                       double pressureReading = altitudeData.pressure.doubleValue * 10.0;
                                       if (strongSelf->lastEmitTime == 0) {
                                         strongSelf->rawPressure = pressureReading;
                                       } else {
                                         strongSelf->rawPressure =
                                           pressureReading * PRESS_FILTERING_FACTOR +
                                           strongSelf->rawPressure * (1.0 - PRESS_FILTERING_FACTOR);
                                       }
                                       strongSelf->altitudeASL =
                                         getAltitude(STANDARD_ATMOSPHERE, strongSelf->rawPressure);
                                       strongSelf->altitude =
                                         getAltitude(strongSelf->localPressurehPa, strongSelf->rawPressure);

                                       double verticalSpeed = 0;
                                       if (strongSelf->lastEmitTime > 0 && timeSinceLastEmit > 0) {
                                         verticalSpeed = ((strongSelf->altitudeASL - lastAltitudeASL) /
                                                          timeSinceLastEmit) *
                                                         1000;
                                       }

                                       [strongSelf emitOnBarometerUpdate:@{
                                         @"timestamp" : @(tempMs),
                                         @"pressure" : @(strongSelf->rawPressure),
                                         @"altitudeASL" : @(strongSelf->altitudeASL),
                                         @"altitude" : @(strongSelf->altitude),
                                         @"relativeAltitude" : altitudeData.relativeAltitude,
                                         @"verticalSpeed" : @(verticalSpeed),
                                       }];

                                       strongSelf->lastEmitTime = tempMs;
                                     }];
  isRunning = YES;
}

- (void)endAltimeterUpdates {
  if (!isRunning) {
    return;
  }
  [altimeter stopRelativeAltitudeUpdates];
  rawPressure = 0;
  altitudeASL = 0;
  altitude = 0;
  lastEmitTime = 0;
  isRunning = NO;
}

+ (NSString *)moduleName
{
  return @"RNBarometer";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRNBarometerSpecJSI>(params);
}

@end
