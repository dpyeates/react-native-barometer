package com.sensorworks.RNBarometer;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorManager;
import android.hardware.SensorEventListener;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Callback;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;

@ReactModule(name = RNBarometerModule.NAME)
public class RNBarometerModule extends ReactContextBaseJavaModule implements LifecycleEventListener, SensorEventListener {
  
  public static final String NAME = "RNBarometer";

  public static final int DEFAULT_INTERVAL_MS = 200;  //  5 Hz
  public static final double DEFAULT_SMOOTHING_FACTOR = 0.7;

  private static final int ignoreSamples = 10;
  private final ReactApplicationContext reactContext;
  private final SensorManager mSensorManager;
  private final Sensor mPressureSensor;
  private boolean isRunning;
  private int mIntervalMillis = DEFAULT_INTERVAL_MS;
  private double mSmoothingFactor = DEFAULT_SMOOTHING_FACTOR;
  private long mLastSampleTime;
  private double mInitialAltitude;
  private double mRelativeAltitude;
  private double mRawPressure;
  private double mAltitudeASL;
  private double mLocalPressurehPa;
  private int mIgnoredSamples;

  public RNBarometerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    this.reactContext.addLifecycleEventListener(this);
    mSensorManager = (SensorManager) reactContext.getSystemService(reactContext.SENSOR_SERVICE);
    mPressureSensor = mSensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE);
    mLocalPressurehPa = SensorManager.PRESSURE_STANDARD_ATMOSPHERE;
    mRawPressure = 0;
    mAltitudeASL = 0;
    mIgnoredSamples = 0;
    mLastSampleTime = 0;
    mRelativeAltitude = 0;
    mInitialAltitude = -1;
    mIntervalMillis = DEFAULT_INTERVAL_MS;
    mSmoothingFactor = DEFAULT_SMOOTHING_FACTOR;
    isRunning = false;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
  }

  @Override
  public void onHostResume() {
    if (isRunning) {
      mSensorManager.registerListener(this, mPressureSensor, mIntervalMillis * 1000);
    }
  }

  @Override
  public void onHostPause() {
    if (isRunning) {
      mSensorManager.unregisterListener(this);
    }
  }

  @Override
  public void onHostDestroy() {
    this.stopObserving();
  }

  //------------------------------------------------------------------------------------------------
  // React interface

  // Required for RN built in EventEmitter Calls.
  @ReactMethod
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(Integer count) {}

  @ReactMethod
  // Determines if this device is capable of providing barometric updates
  public void isSupported(Promise promise) {
    promise.resolve(mPressureSensor != null);
  }

  @ReactMethod
  // Sets the interval between event samples
  public void setInterval(int interval) {
    mIntervalMillis = interval;
    boolean shouldStart = isRunning;
    stopObserving();
    if(shouldStart) {
      startObserving(null);
    }
  }

  @ReactMethod
  // Sets the local pressure in hectopascals
  public void setLocalPressure(double pressurehPa) {
    mLocalPressurehPa = pressurehPa;
  }

  @ReactMethod
  // Sets smoothing factor [0 -1].
  // Note: More smoothing means more latency before
  // the smoothed value has "caught up with" current
  // conditions.
  public void setSmoothingFactor(double smoothingFactor) {
    if (smoothingFactor >= 0 && smoothingFactor <= 1.0) {
      mSmoothingFactor = smoothingFactor;
    }
  }

  @ReactMethod
  // Gets smoothing factor
  public double getSmoothingFactor(Promise promise) {
    return promise.resolve(mSmoothingFactor);
  }

  @ReactMethod
  // Starts observing pressure
  public void startObserving(Promise promise) {
    if (mPressureSensor == null) {
      promise.reject("-1",
          "Pressure sensor not available; will not provide barometer data.");
      return;
    }
    isRunning = true;
    mSensorManager.registerListener(this, mPressureSensor, mIntervalMillis * 1000);
    promise.resolve(mIntervalMillis);
  }

  @ReactMethod
  // Stops observing pressure
  public void stopObserving() {
    mSensorManager.unregisterListener(this);
    mRawPressure = 0;
    mAltitudeASL = 0;
    mLastSampleTime = 0;
    mRelativeAltitude = 0;
    mIgnoredSamples = 0;
    mInitialAltitude = -1;
    isRunning = false;
  }

  //------------------------------------------------------------------------------------------------
  // Internal methods

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    long tempMs = System.currentTimeMillis();
    long timeSinceLastUpdate = tempMs - mLastSampleTime;
    if (timeSinceLastUpdate >= mIntervalMillis) {
      double lastAltitudeASL = mAltitudeASL;
      // Get the smoothed raw pressure in millibar/hPa
      mRawPressure = (sensorEvent.values[0] * (((double)1.0) - mSmoothingFactor) + mRawPressure * mSmoothingFactor);
      // Calculate standard atmosphere altitude in metres
      mAltitudeASL = getAltitude(SensorManager.PRESSURE_STANDARD_ATMOSPHERE, mRawPressure);
      // Calculate our vertical speed in metres per second
      double verticalSpeed = ((mAltitudeASL - lastAltitudeASL) / timeSinceLastUpdate) * 1000;
      // Calculate our altitude based on our local pressure
      double altitude = getAltitude(mLocalPressurehPa, mRawPressure);
      // Calculate our relative altitude. This reflects the change in the current altitude,
      // not the absolute altitude. So a hiking app might use this object to track the
      // user’s elevation gain over the course of a hike for example.
      if (mInitialAltitude == -1) {
        if (mIgnoredSamples < ignoreSamples) {
          mIgnoredSamples++;
        } else {
          mInitialAltitude = mAltitudeASL;
        }
      } else {
        mRelativeAltitude = mAltitudeASL - mInitialAltitude;
      }
      // Send change events to the Javascript side via the React Native bridge
      WritableMap map = Arguments.createMap();
      map.putDouble("timestamp", (double) tempMs);
      map.putDouble("pressure", mRawPressure);
      map.putDouble("altitudeASL", mAltitudeASL);
      map.putDouble("altitude", altitude);
      map.putDouble("relativeAltitude", mRelativeAltitude);
      map.putDouble("verticalSpeed", verticalSpeed);
      try {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("barometerUpdate", map);
      } catch (RuntimeException e) {
        Log.e("ERROR", "Error sending event over the React bridge");
      }
      mLastSampleTime = tempMs;
    }
  }

  // Computes the Altitude in meters from the atmospheric pressure and the pressure at sea level.
  // p0 pressure at sea level
  // p atmospheric pressure
  // returns an altitude in meters
  private static double getAltitude(double p0, double p) {
    final double coef = 1.0 / 5.255;
    return 44330.0 * (1.0 - Math.pow(p / p0, coef));
  }

}
