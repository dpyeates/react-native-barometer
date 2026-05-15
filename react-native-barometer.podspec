require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-barometer"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = package["description"]
  s.homepage     = "https://github.com/dpyeates/react-native-barometer"
  s.license      = "MIT"
  s.authors      = { "Darren Yeates" => "apps@sensorworks.co.uk" }
  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/dpyeates/react-native-barometer.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.requires_arc = true
  s.frameworks = "CoreMotion"

  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
  }

  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
