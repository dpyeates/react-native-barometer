package com.sensorworks.RNBarometer

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap

class RNBarometerModule(reactContext: ReactApplicationContext) :
  NativeRNBarometerSpec(reactContext), LifecycleEventListener, SensorEventListener {

  private val sensorManager: SensorManager =
    reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val pressureSensor: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE)

  private var isRunning = false
  private var intervalMillis = DEFAULT_INTERVAL_MS
  private var lastEmitTime: Long = 0
  private var baselineAltitude: Double? = null
  private var rawPressure = 0.0
  private var altitudeASL = 0.0
  private var localPressurehPa = SensorManager.PRESSURE_STANDARD_ATMOSPHERE.toDouble()

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  override fun onHostResume() {
    if (isRunning && pressureSensor != null) {
      sensorManager.registerListener(this, pressureSensor, intervalMillis * 1000)
    }
  }

  override fun onHostPause() {
    if (isRunning) {
      sensorManager.unregisterListener(this)
    }
  }

  override fun onHostDestroy() {
    stopObserving()
  }

  override fun isSupported(promise: Promise) {
    promise.resolve(pressureSensor != null)
  }

  override fun setInterval(interval: Double) {
    intervalMillis = clampIntervalMillis(interval)
    val shouldStart = isRunning
    stopObserving()
    if (shouldStart) {
      startObserving()
    }
  }

  override fun setLocalPressure(pressurehPa: Double) {
    if (pressurehPa > 0) {
      localPressurehPa = pressurehPa
    }
  }

  override fun startObserving() {
    if (pressureSensor == null) {
      Log.w(NAME, "Pressure sensor not available; will not provide barometer data.")
      return
    }
    baselineAltitude = null
    lastEmitTime = 0
    isRunning = true
    sensorManager.registerListener(this, pressureSensor, intervalMillis * 1000)
  }

  override fun stopObserving() {
    sensorManager.unregisterListener(this)
    rawPressure = 0.0
    altitudeASL = 0.0
    lastEmitTime = 0
    baselineAltitude = null
    isRunning = false
  }

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    val tempMs = System.currentTimeMillis()
    val timeSinceLastEmit = tempMs - lastEmitTime
    if (lastEmitTime > 0 && timeSinceLastEmit < intervalMillis) {
      return
    }

    val lastAltitudeASL = altitudeASL
    val pressureReading = sensorEvent.values[0].toDouble()
    rawPressure =
      if (lastEmitTime == 0L) {
        pressureReading
      } else {
        pressureReading * PRESS_FILTERING_FACTOR +
          rawPressure * (1.0 - PRESS_FILTERING_FACTOR)
      }
    altitudeASL =
      getAltitude(SensorManager.PRESSURE_STANDARD_ATMOSPHERE.toDouble(), rawPressure)
    val altitude = getAltitude(localPressurehPa, rawPressure)

    val baseline = baselineAltitude
    val relativeAltitude =
      if (baseline == null) {
        baselineAltitude = altitudeASL
        0.0
      } else {
        altitudeASL - baseline
      }

    val verticalSpeed =
      if (lastEmitTime > 0 && timeSinceLastEmit > 0) {
        ((altitudeASL - lastAltitudeASL) / timeSinceLastEmit) * 1000
      } else {
        0.0
      }

    val map: WritableMap = Arguments.createMap()
    map.putDouble("timestamp", tempMs.toDouble())
    map.putDouble("pressure", rawPressure)
    map.putDouble("altitudeASL", altitudeASL)
    map.putDouble("altitude", altitude)
    map.putDouble("relativeAltitude", relativeAltitude)
    map.putDouble("verticalSpeed", verticalSpeed)
    emitOnBarometerUpdate(map)

    lastEmitTime = tempMs
  }

  companion object {
    const val NAME = "RNBarometer"
    private const val PRESS_FILTERING_FACTOR = 0.3
    private const val DEFAULT_INTERVAL_MS = 200
    private const val MIN_INTERVAL_MS = 50

    private fun clampIntervalMillis(interval: Double): Int {
      val ms = interval.toInt()
      return if (ms < MIN_INTERVAL_MS) MIN_INTERVAL_MS else ms
    }

    private fun getAltitude(p0: Double, p: Double): Double {
      val coef = 1.0 / 5.255
      return 44330.0 * (1.0 - Math.pow(p / p0, coef))
    }
  }
}
