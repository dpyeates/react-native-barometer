#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <CoreMotion/CoreMotion.h>

@interface RNBarometer : RCTEventEmitter <RCTBridgeModule> {
    CMAltimeter *altimeter;
    NSOperationQueue *altimeterQueue;
    bool observing;
    bool isSupported;
    long intervalMillis;
    long long lastSampleTime;
    double localPressurehPa;
    double rawPressure;
    double altitudeASL;
    double altitude;
}

@end
