import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(REPO_ROOT, 'apps/mobile/android');
const JNI_LIBS_DIR = path.join(REPO_ROOT, 'apps/mobile/modules/docchisel-bridge/android/src/main/jniLibs');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('==================================================');
  console.log('📱 [DocChisel] Android Build & Packaging Pipeline');
  console.log('==================================================');
  console.log('Usage: node scripts/build-mobile.mjs [options]');
  console.log('\nOptions:');
  console.log('  • --apk-release  Build 3 release APKs (arm64-v8a, armeabi-v7a, universal) [default]');
  console.log('  • --bundle       Build optimized release .aab for Google Play Store');
  console.log('  • --apk-debug    Build debug APK for rapid local testing');
  console.log('  • --help, -h     Show this help message');
  console.log('==================================================');
  process.exit(0);
}

const isDebug = args.includes('--apk-debug') || args.includes('--debug');
const isBundle = args.includes('--bundle') || args.includes('--aab');
const isReleaseApk = args.includes('--apk-release') || args.includes('--release') || (!isDebug && !isBundle);

console.log('==================================================');
console.log('📱 [DocChisel] Android Build & Packaging Pipeline');
console.log(`   Host OS:   ${process.platform} (${process.arch})`);
console.log(`   Operation: ${isBundle ? 'Google Play App Bundle (.aab)' : (isDebug ? 'Debug APK (.apk)' : 'Release APKs (arm64, armv7, universal)')}`);
console.log('==================================================');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function findFilesRecursive(dir, filterFn, maxDepth = 8, currentDepth = 0) {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return [];
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFilesRecursive(fullPath, filterFn, maxDepth, currentDepth + 1));
      } else if (entry.isFile() && filterFn(entry.name, fullPath)) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

function purgeOsMetadata(targetDir) {
  if (!targetDir || !fs.existsSync(targetDir)) return;
  const isWin = process.platform === 'win32';
  if (isWin) {
    try {
      execSync('attrib -r -s -h Thumbs.db /s 2>nul & attrib -r -s -h desktop.ini /s 2>nul & del /s /q /f /a Thumbs.db desktop.ini ehthumbs.db .DS_Store 2>nul || exit 0', {
        cwd: targetDir,
        stdio: 'ignore',
        shell: 'cmd.exe',
      });
    } catch {}
  } else {
    try {
      execSync(`find "${targetDir}" \\( -name ".DS_Store" -o -name "Thumbs.db" -o -name "desktop.ini" -o -name "ehthumbs.db" \\) -delete 2>/dev/null || true`, {
        stdio: 'ignore',
      });
    } catch {}
  }
}

// ----------------------------------------------------
// 1. Validate Android SDK & Environment Variables
// ----------------------------------------------------
let androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;

if (!androidHome) {
  const candidateSdkPaths = [];
  if (process.platform === 'win32') {
    if (process.env.LOCALAPPDATA) {
      candidateSdkPaths.push(path.join(process.env.LOCALAPPDATA, 'Android/Sdk'));
    }
    candidateSdkPaths.push('C:\\Android\\Sdk');
  } else if (process.platform === 'darwin') {
    if (process.env.HOME) {
      candidateSdkPaths.push(path.join(process.env.HOME, 'Library/Android/sdk'));
    }
  } else {
    if (process.env.HOME) {
      candidateSdkPaths.push(path.join(process.env.HOME, 'Android/Sdk'));
      candidateSdkPaths.push(path.join(process.env.HOME, '.android/sdk'));
    }
    candidateSdkPaths.push('/opt/android-sdk');
  }

  for (const cand of candidateSdkPaths) {
    if (fs.existsSync(cand)) {
      androidHome = cand;
      process.env.ANDROID_HOME = cand;
      process.env.ANDROID_SDK_ROOT = cand;
      console.log(`  ✓ Auto-detected Android SDK at: ${cand}`);
      break;
    }
  }
}

if (!androidHome || !fs.existsSync(androidHome)) {
  console.warn('⚠️ Warning: ANDROID_HOME or ANDROID_SDK_ROOT environment variable is not configured.');
  console.warn('   If Gradle fails, please configure ANDROID_HOME pointing to your Android SDK.');
} else {
  console.log(`  ✓ Android SDK: ${androidHome}`);
}

// ----------------------------------------------------
// 2. Validate Java 17 Runtime
// ----------------------------------------------------
try {
  const javaVer = execSync('java -version 2>&1', { encoding: 'utf8' });
  const firstLine = javaVer.split('\n')[0] || '';
  console.log(`  ✓ Java Runtime: ${firstLine.trim()}`);
} catch {
  console.error('\n❌ Error: Java runtime (JDK 17) is not found in PATH.');
  console.error('   Please install JDK 17 (OpenJDK or Eclipse Temurin) and set JAVA_HOME.');
  process.exit(1);
}

// ----------------------------------------------------
// 3. Verify Native Mobile Engine (.so in jniLibs)
// ----------------------------------------------------
const arm64So = path.join(JNI_LIBS_DIR, 'arm64-v8a/libcore_engine.so');
if (!fs.existsSync(arm64So)) {
  console.log('\n==> ℹ️ Android native Rust core engine not yet compiled for jniLibs.');
  console.log('    Triggering automatic build-mobile-engine...');
  const buildEngineScript = path.join(REPO_ROOT, 'scripts/build-mobile-engine.mjs');
  const engineArgs = isDebug
    ? ['--android']
    : ['--release', '--android'];

  const engineRes = spawnSync('node', [buildEngineScript, ...engineArgs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });

  if (engineRes.status !== 0 || !fs.existsSync(arm64So)) {
    console.error('\n❌ Error: Failed to compile Android native engine in jniLibs.');
    console.error('   Run manually: npm run mobile:build-engine:android');
    process.exit(1);
  }
} else {
  console.log('  ✓ Native Rust engine (.so) present in jniLibs');
}

// ----------------------------------------------------
// 4. Sanitize OS Metadata (Prevents Android Prefab Crash)
// ----------------------------------------------------
try {
  purgeOsMetadata(path.join(REPO_ROOT, 'apps/mobile'));
  const gradleHome = process.env.GRADLE_USER_HOME ||
    (process.env.HOME ? path.join(process.env.HOME, '.gradle') : (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.gradle') : null));
  if (gradleHome && fs.existsSync(path.join(gradleHome, 'caches'))) {
    purgeOsMetadata(path.join(gradleHome, 'caches'));
  }
} catch {}

// ----------------------------------------------------
// 5. Execute Gradle Build
// ----------------------------------------------------
const isWin = process.platform === 'win32';
const gradlewCmd = isWin ? 'gradlew.bat' : './gradlew';

// Ensure gradlew has execute permissions on Unix
if (!isWin) {
  try {
    fs.chmodSync(path.join(ANDROID_DIR, 'gradlew'), 0o755);
  } catch {}
}

const gradleTasks = [];
if (isBundle) {
  gradleTasks.push('bundleRelease', '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64');
} else if (isDebug) {
  gradleTasks.push('assembleDebug');
} else {
  gradleTasks.push('assembleRelease', '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64');
}

console.log(`\n==> Running Gradle: ${gradlewCmd} ${gradleTasks.join(' ')}\n`);

const buildRes = spawnSync(gradlewCmd, gradleTasks, {
  cwd: ANDROID_DIR,
  stdio: 'inherit',
  shell: isWin,
  env: process.env,
});

// ----------------------------------------------------
// 6. Always Stop Gradle Daemon to release file locks & RAM
// ----------------------------------------------------
console.log('\n==> Stopping Gradle daemon...');
try {
  spawnSync(gradlewCmd, ['--stop'], {
    cwd: ANDROID_DIR,
    stdio: 'ignore',
    shell: isWin,
  });
  console.log('  ✓ Gradle daemon stopped');
} catch {}

if (buildRes.status !== 0) {
  console.error('\n❌ Android build failed.');
  process.exit(1);
}

// ----------------------------------------------------
// 7. Clean Intermediate Build Bloat (Without rm -rf)
// ----------------------------------------------------
console.log('==> Reclaiming intermediate build scratchpads...');
const scratchPaths = [
  path.join(ANDROID_DIR, 'app/build/intermediates'),
  path.join(ANDROID_DIR, 'app/.cxx'),
];
for (const p of scratchPaths) {
  if (fs.existsSync(p)) {
    try {
      fs.rmSync(p, { recursive: true, force: true });
    } catch {}
  }
}
console.log('  ✓ Cleaned build intermediates & CMake caches');

// ----------------------------------------------------
// 8. Verify & Display Generated Artifacts
// ----------------------------------------------------
const outDir = path.join(ANDROID_DIR, 'app/build/outputs');
const filterExt = isBundle ? '.aab' : '.apk';
const artifacts = findFilesRecursive(outDir, (name) => name.toLowerCase().endsWith(filterExt));

console.log('\n==================================================');
console.log('🎉 Android Packaging Complete!');
if (artifacts.length > 0) {
  console.log('\nGenerated Output Files:');
  for (const art of artifacts) {
    const stats = fs.statSync(art);
    console.log(`  • ${path.basename(art)} (${formatBytes(stats.size)})`);
  }
  console.log('\nTo collect into the unified releases/ directory:');
  console.log('  npm run package:artifacts');
} else {
  console.warn('⚠️ Warning: Build succeeded but no output binaries were found in app/build/outputs.');
}
console.log('==================================================\n');
