package com.sensorworks.RNBarometer

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RNBarometerPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == RNBarometerModule.NAME) {
      RNBarometerModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        RNBarometerModule.NAME to
          ReactModuleInfo(
            RNBarometerModule.NAME,
            RNBarometerModule.NAME,
            false,
            false,
            false,
            true,
          ),
      )
    }
  }
}
