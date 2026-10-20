import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const isRelease = process.argv.includes('--release');
const isAndroidOnly = process.argv.includes('--android');
const isIosOnly = process.argv.includes('--ios');
const shouldPrune = process.argv.includes('--prune') || process.argv.includes('--prune-intermediates');

const targetArgIndex = process.argv.indexOf('--target');
const customTarget = targetArgIndex !== -1 ? process.argv[targetArgIndex + 1] : null;

const shouldBuildAndroid = !isIosOnly;
const shouldBuildIos = !isAndroidOnly;

console.log('==================================================');
console.log(`==> [DocChisel] Building Core Engine for Mobile (${isRelease ? 'Release' : 'Dev'})`);
if (isAndroidOnly) console.log('==> Platform Filter: Android only');
if (isIosOnly) console.log('==> Platform Filter: iOS only');
if (customTarget) console.log(`==> Specific Target ABI: ${customTarget}`);
console.log('==================================================');

const androidJniLibs = path.join(
  REPO_ROOT,
  'apps/mobile/modules/docchisel-bridge/android/src/main/jniLibs'
);
const iosLibDir = path.join(REPO_ROOT, 'apps/mobile/modules/docchisel-bridge/ios');
const kotlinOut = path.join(
  REPO_ROOT,
  'apps/mobile/modules/docchisel-bridge/android/src/main/java'
);

fs.mkdirSync(androidJniLibs, { recursive: true });
fs.mkdirSync(iosLibDir, { recursive: true });
fs.mkdirSync(kotlinOut, { recursive: true });

function runCommand(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  return result.status === 0;
}

function hasCommand(cmd) {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(checkCmd, [cmd], { stdio: 'ignore', shell: process.platform === 'win32' });
  return res.status === 0;
}

// 1. Build Android shared libraries (.so) via cargo-ndk
if (shouldBuildAndroid) {
  if (hasCommand('cargo-ndk')) {
    console.log('==> Compiling for Android via cargo-ndk (16 KB page-size aligned)...');
    const env = {
      ...process.env,
      CARGO_TARGET_AARCH64_LINUX_ANDROID_RUSTFLAGS: '-C link-arg=-Wl,-z,max-page-size=16384',
      CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_RUSTFLAGS: '-C link-arg=-Wl,-z,max-page-size=16384',
      CARGO_TARGET_X86_64_LINUX_ANDROID_RUSTFLAGS: '-C link-arg=-Wl,-z,max-page-size=16384',
      CARGO_TARGET_I686_LINUX_ANDROID_RUSTFLAGS: '-C link-arg=-Wl,-z,max-page-size=16384',
    };

    if (customTarget) {
      console.log(`==> Targeted Android Build: [${customTarget}]`);
      const targetArgs = ['ndk', '-t', customTarget, '-o', androidJniLibs, 'build'];
      if (isRelease) targetArgs.push('--release');
      targetArgs.push('--package', 'core_engine');
      const ok = runCommand('cargo', targetArgs, { env });
      if (ok) console.log(`✓ Android .so built for ${customTarget} in ${androidJniLibs}`);
    } else if (isRelease) {
      console.log('==> Android Targets: [arm64-v8a, armeabi-v7a, x86_64]');
      const ok = runCommand(
        'cargo',
        ['ndk', '-t', 'arm64-v8a', '-t', 'armeabi-v7a', '-t', 'x86_64', '-o', androidJniLibs, 'build', '--release', '--package', 'core_engine'],
        { env }
      );
      if (ok) console.log(`✓ Multi-target Android .so libraries built in ${androidJniLibs}`);
    } else {
      // Clean stale non-dev architectures
      for (const stale of ['armeabi-v7a', 'x86_64', 'x86']) {
        const p = path.join(androidJniLibs, stale);
        if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
      }
      console.log('==> Fast dev Android Target: [arm64-v8a only]');
      const ok = runCommand(
        'cargo',
        ['ndk', '-t', 'arm64-v8a', '-o', androidJniLibs, 'build', '--package', 'core_engine'],
        { env }
      );
      if (ok) console.log(`✓ Fast local dev arm64-v8a .so built in ${androidJniLibs}`);
    }
  } else {
    console.log('ℹ️ cargo-ndk not found in PATH. Skipping Android native compilation.');
  }
} else {
  console.log('ℹ️ Skipping Android build (--ios specified).');
}

// 2. Build iOS static library (.a) - only supported on macOS
if (shouldBuildIos) {
  if (process.platform === 'darwin') {
    console.log('==> Compiling for iOS targets...');
    const buildArgs = ['build', '--package', 'core_engine'];
    if (isRelease) buildArgs.push('--release');

    const simArgs = [...buildArgs, '--target', 'aarch64-apple-ios-sim'];
    const simOk = runCommand('cargo', simArgs);
    const targetSubdir = isRelease ? 'release' : 'debug';

    if (simOk) {
      const src = path.join(REPO_ROOT, `target/aarch64-apple-ios-sim/${targetSubdir}/libcore_engine.a`);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(iosLibDir, 'libcore_engine.a'));
        console.log(`✓ Built iOS static library: libcore_engine.a (${isRelease ? 'release' : 'dev'})`);
      }
    } else {
      // Fallback to host build
      const hostOk = runCommand('cargo', buildArgs);
      if (hostOk) {
        const src = path.join(REPO_ROOT, `target/${targetSubdir}/libcore_engine.a`);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(iosLibDir, 'libcore_engine.a'));
          console.log('ℹ️ iOS simulator target not configured; using host build as placeholder.');
        }
      }
    }
  } else {
    console.log('ℹ️ Skipping iOS build (requires macOS and Xcode).');
  }
} else {
  console.log('ℹ️ Skipping iOS build (--android specified).');
}

// 3. Generate UniFFI Bindings for Swift and Kotlin
console.log('==> Generating UniFFI Bindings for Swift and Kotlin...');

let dylibName = 'libcore_engine.dylib';
if (process.platform === 'win32') {
  dylibName = 'core_engine.dll';
} else if (process.platform === 'linux') {
  dylibName = 'libcore_engine.so';
}

// Check if a pre-existing host library exists in release or debug
let dylibPath = isRelease
  ? path.join(REPO_ROOT, 'target/release', dylibName)
  : path.join(REPO_ROOT, 'target/debug', dylibName);

if (!fs.existsSync(dylibPath)) {
  const fallbackPath = isRelease
    ? path.join(REPO_ROOT, 'target/debug', dylibName)
    : path.join(REPO_ROOT, 'target/release', dylibName);
  if (fs.existsSync(fallbackPath)) {
    dylibPath = fallbackPath;
  }
}

if (!fs.existsSync(dylibPath)) {
  console.log('==> Compiling host library for UniFFI schema extraction...');
  const hostArgs = ['build', '--package', 'core_engine'];
  if (isRelease) hostArgs.push('--release');
  runCommand('cargo', hostArgs);
  dylibPath = path.join(REPO_ROOT, isRelease ? 'target/release' : 'target/debug', dylibName);
}

if (fs.existsSync(dylibPath)) {
  const genResult = spawnSync(
    'cargo',
    [
      'run',
      '--package',
      'core_engine',
      '--bin',
      'uniffi-bindgen',
      '--',
      'generate',
      '--library',
      dylibPath,
      '--language',
      'swift',
      '--language',
      'kotlin',
      '--no-format',
      '--out-dir',
      iosLibDir,
    ],
    { cwd: REPO_ROOT, stdio: 'inherit', shell: process.platform === 'win32' }
  );

  // Copy Kotlin output to proper package structure
  const uniffiDir = path.join(iosLibDir, 'uniffi');
  if (fs.existsSync(uniffiDir)) {
    const destUniffi = path.join(kotlinOut, 'uniffi');
    if (fs.existsSync(destUniffi)) {
      fs.rmSync(destUniffi, { recursive: true, force: true });
    }
    fs.cpSync(uniffiDir, destUniffi, { recursive: true });
    fs.rmSync(uniffiDir, { recursive: true, force: true });
    console.log('✓ Generated Kotlin bindings in Android docchisel-bridge module');
  }

  if (fs.existsSync(path.join(iosLibDir, 'docchisel_core.swift'))) {
    console.log('✓ Generated Swift bindings in iOS docchisel-bridge module');
  }
}

// 4. Auto-prune disposable intermediate scratch caches if requested
if (shouldPrune) {
  const pruneScript = path.join(REPO_ROOT, 'scripts/prune-intermediates.mjs');
  if (fs.existsSync(pruneScript)) {
    runCommand('node', [pruneScript]);
  }
}

console.log('\n✓ Mobile native engine build complete!\n==================================================');
