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
import kotlin.math.pow

class RNBarometerModule(reactContext: ReactApplicationContext) :
  NativeRNBarometerSpec(reactContext), LifecycleEventListener, SensorEventListener {

  private val sensorManager: SensorManager =
    reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val pressureSensor: Sensor? = sensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE)

  private var wantsObserving = false
  private var isRunning = false
  private var intervalMillis = DEFAULT_INTERVAL_MS
  private var lastEmitTime: Long = 0
  private var baselineAltitude: Double? = null
  private var rawPressure = 0.0
  private var altitudeASL = 0.0
  private var localPressurehPa = SensorManager.PRESSURE_STANDARD_ATMOSPHERE.toDouble()
  private var pressFilteringFactor = DEFAULT_PRESS_FILTERING_FACTOR
  private var sensorAccuracy = -1
  private var hasPendingAltitudeReference = false
  private var pendingAltitudeReferenceMetres = 0.0

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
    sensorAccuracy = accuracy
  }

  override fun onHostResume() {
    if (wantsObserving && !isRunning && pressureSensor != null) {
      registerSensor()
    }
  }

  override fun onHostPause() {
    if (isRunning) {
      unregisterSensor(keepWantsObserving = true)
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
    val shouldStart = wantsObserving
    stopObservingInternal()
    if (shouldStart) {
      startObserving()
    }
  }

  override fun setLocalPressure(pressurehPa: Double) {
    if (pressurehPa > 0) {
      localPressurehPa = pressurehPa
      hasPendingAltitudeReference = false
    }
  }

  override fun setSmoothing(alpha: Double) {
    pressFilteringFactor = clampSmoothing(alpha)
  }

  override fun setAltitudeReference(metres: Double) {
    if (!metres.isFinite()) {
      return
    }
    if (rawPressure > 0) {
      localPressurehPa = pressureFromAltitude(metres, rawPressure)
      hasPendingAltitudeReference = false
    } else {
      pendingAltitudeReferenceMetres = metres
      hasPendingAltitudeReference = true
    }
  }

  override fun resetRelativeAltitude() {
    baselineAltitude = null
  }

  override fun startObserving() {
    wantsObserving = true
    if (pressureSensor == null) {
      Log.w(NAME, "Pressure sensor not available; will not provide barometer data.")
      val map: WritableMap = Arguments.createMap()
      map.putString("code", "sensor_unavailable")
      map.putString("message", "Pressure sensor not available on this device.")
      emitOnBarometerError(map)
      wantsObserving = false
      return
    }
    baselineAltitude = null
    lastEmitTime = 0
    registerSensor()
  }

  override fun stopObserving() {
    wantsObserving = false
    stopObservingInternal()
  }

  private fun stopObservingInternal() {
    unregisterSensor(keepWantsObserving = wantsObserving)
    rawPressure = 0.0
    altitudeASL = 0.0
    lastEmitTime = 0
    baselineAltitude = null
  }

  private fun registerSensor() {
    val sensor = pressureSensor ?: return
    if (isRunning) {
      return
    }
    // SensorManager expects microseconds for the sampling period.
    sensorManager.registerListener(this, sensor, intervalMillis * 1000)
    isRunning = true
  }

  private fun unregisterSensor(keepWantsObserving: Boolean) {
    if (!isRunning) {
      return
    }
    sensorManager.unregisterListener(this)
    isRunning = false
    if (!keepWantsObserving) {
      wantsObserving = false
    }
  }

  private fun applyPendingAltitudeReferenceIfNeeded() {
    if (!hasPendingAltitudeReference || rawPressure <= 0) {
      return
    }
    localPressurehPa = pressureFromAltitude(pendingAltitudeReferenceMetres, rawPressure)
    hasPendingAltitudeReference = false
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
        pressureReading * pressFilteringFactor +
          rawPressure * (1.0 - pressFilteringFactor)
      }

    applyPendingAltitudeReferenceIfNeeded()

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
    map.putDouble("accuracy", sensorAccuracy.toDouble())
    emitOnBarometerUpdate(map)

    lastEmitTime = tempMs
  }

  companion object {
    const val NAME = "RNBarometer"
    private const val DEFAULT_PRESS_FILTERING_FACTOR = 0.3
    private const val MIN_PRESS_FILTERING_FACTOR = 0.01
    private const val DEFAULT_INTERVAL_MS = 200
    private const val MIN_INTERVAL_MS = 50

    private fun clampIntervalMillis(interval: Double): Int {
      val ms = interval.toInt()
      return if (ms < MIN_INTERVAL_MS) MIN_INTERVAL_MS else ms
    }

    private fun clampSmoothing(alpha: Double): Double {
      if (!alpha.isFinite()) {
        return DEFAULT_PRESS_FILTERING_FACTOR
      }
      return alpha.coerceIn(MIN_PRESS_FILTERING_FACTOR, 1.0)
    }

    private fun getAltitude(p0: Double, p: Double): Double {
      val coef = 1.0 / 5.255
      return 44330.0 * (1.0 - (p / p0).pow(coef))
    }

    private fun pressureFromAltitude(altitudeMetres: Double, p: Double): Double {
      val ratio = 1.0 - altitudeMetres / 44330.0
      if (ratio <= 0.0 || p <= 0.0) {
        return SensorManager.PRESSURE_STANDARD_ATMOSPHERE.toDouble()
      }
      return p / ratio.pow(5.255)
    }
  }
}
