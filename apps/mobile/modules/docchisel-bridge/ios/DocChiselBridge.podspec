Pod::Spec.new do |s|
  s.name           = 'DocChiselBridge'
  s.version        = '0.1.0'
  s.summary        = 'DocChisel Local Rust Engine Bridge'
  s.description    = 'Local Expo Module bridging Rust core_engine to React Native'
  s.author         = 'Ankush Sarkar'
  s.homepage       = 'https://github.com/ankrypht/DocChisel'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :path => '.' }
  s.source_files   = '**/*.{h,m,swift}'
  s.vendored_libraries = 'libcore_engine.a'
  s.dependency 'ExpoModulesCore'
  s.swift_version  = '5.0'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
