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

@ReactModule(name = RNAttitudeModule.NAME)
public class BarometerModule extends ReactContextBaseJavaModule implements LifecycleEventListener, SensorEventListener {
  public static final String NAME = "RNBarometer";
  private static final float kPressFilteringFactor = 0.3f;
  private final ReactApplicationContext reactContext;
  private final SensorManager mSensorManager;
  private Sensor mPressureSensor;
  private boolean mObserving;
  private int mIntervalMillis; 
  private long lastPressureTime;
  private float mInitialAltitude;
  private float mRelativeAltitude;
  private float mRawPressure;
  private float mAltitudeASL;
  private float mLocalPressurehPa; 

  public RNBarometerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    this.reactContext.addLifecycleEventListener(this);
    mSensorManager = (SensorManager) reactContext.getSystemService(reactContext.SENSOR_SERVICE);
    mPressureSensor = sensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE);
    mLocalPressurehPa = SensorManager.PRESSURE_STANDARD_ATMOSPHERE;
    mRawPressure = 0;
    mAltitudeASL = 0;
    mLastSampleTime = 0;
    mRelativeAltitude = 0;
    mInitialAltitude = -1;
    mIntervalMillis = 200;
    mObserving = false;
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
    if(mObserving) {
      mSensorManager.registerListener(this, mPressureSensor, mIntervalMillis * 1000);
    }
  }

  @Override
  public void onHostPause() {
    if(mObserving) {
      mSensorManager.unregisterListener(this);
    }
  }

  @Override
  public void onHostDestroy() {
    this.stopObserving();
  }

  //------------------------------------------------------------------------------------------------
  // React interface

  @ReactMethod
  // Determines if this device is capable of providing barometric updates
  public void isSupported(Promise promise) {
    promise.resolve(mPressureSensor != null);
  }

  @ReactMethod
  // Sets the interval between event samples
  public void setInterval(int interval) {
    mIntervalMillis = interval;
  }
 
  @ReactMethod
  // Sets the local pressure in hectopascals
  public void setLocalPressure(float pressurehPa) {
    mLocalPressurehPa = pressurehPa;
  }

  @ReactMethod
  // Starts observing pressure
  public void startObserving(Promise promise) {
    if (mPressureSensor == null) {
      promise.reject("-1",
          "Pressure sensor not available; will not provide orientation data.");
      return;
    }
    mObserving = true;
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
    mInitialAltitude = -1;
    mObserving = false;
  }

  //------------------------------------------------------------------------------------------------
  // Internal methods

  @Override
  public void onSensorChanged(SensorEvent sensorEvent) {
    long tempMs = (double) System.currentTimeMillis();
    long timeSinceLastUpdate = (tempMs - mLastSampleTime);
    if (timeSinceLastUpdate >= mIntervalMillis){
      mLastSampleTime = tempMs;
      float lastAltitudeASL = mAltitudeASL;
      // Get the raw pressure in millibar/hPa
      mRawPressure = (float) (sensorEvent.values[0] * kPressFilteringFactor + mRawPressure * (1.0 - kPressFilteringFactor));
      // Calculate standard atmpsphere altitude in metres
      mAltitudeASL = getAltitude(SensorManager.PRESSURE_STANDARD_ATMOSPHERE, mRawPressure);
      // Calculate our vertical speed in metres per second
      float verticalSpeed = ((mAltitudeASL - lastAltitudeASL) / timeSinceLastUpdate) * 1000;
      // Calculate our altitude based on our local pressure
      float altitude = getAltitude(mLocalPressurehPa, mRawPressure);
      // Calculate our relative altitude. This reflects the change in the current altitude, 
      // not the absolute altitude. So a hiking app might use this object to track the
      // user’s elevation gain over the course of a hike for example.
      if(mInitialAltitude == -1) {
        mInitialAltitude = mInitialAltitude;
      }
      else {
        mRelativeAltitude = mAltitudeASL - mInitialAltitude;
      }
      // Send change events to the Javascript side via the React Native bridge 
      WritableMap map = Arguments.createMap();
      map.putInt("timestamp", tempMs);
      map.putFloat("pressure", mRawPressure);
      map.putFloat("altitudeASL", mAltitudeASL);
      map.putFloat("altitude", altitude);
      map.putFloat("relativeAltitude", mRelativeAltitude);
      map.putFloat("verticalSpeed", verticalSpeed);
      try {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("altitudeDidChange", map);
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
  private static float getAltitude(float p0, float p)
  {
    final float coef = 1.0f / 5.255f;
    return 44330.0f * (1.0f - (float)Math.pow(p/p0, coef));
  }
}
