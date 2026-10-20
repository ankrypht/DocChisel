import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const isDeep = process.argv.includes('--deep');
const isIntermediates = process.argv.includes('--intermediates');

if (isIntermediates) {
  // Delegate directly to the intermediate pruner
  const pruneScript = path.join(REPO_ROOT, 'scripts/prune-intermediates.mjs');
  spawnSync('node', [pruneScript], { cwd: REPO_ROOT, stdio: 'inherit' });
  process.exit(0);
}

console.log('==================================================');
console.log(`🧹 [DocChisel] Cleaning Build Artifacts & Caches ${isDeep ? '(Deep Mode)' : ''}`);
console.log('==================================================');

function removeSafe(targetPath, description) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      const relative = path.relative(REPO_ROOT, targetPath);
      console.log(`  ✓ Removed ${description || relative}`);
    }
  } catch {}
}

// 1. Rust Cargo Clean
console.log('==> Cleaning Rust build caches...');
try {
  execSync('cargo clean', { cwd: REPO_ROOT, stdio: 'ignore' });
  console.log('  ✓ cargo clean completed');
} catch {
  removeSafe(path.join(REPO_ROOT, 'target'), 'Root target directory');
  removeSafe(path.join(REPO_ROOT, 'apps/desktop/src-tauri/target'), 'Desktop Tauri target directory');
}

// 2. Android Build Artifacts & Caches
console.log('==> Cleaning Android build artifacts & intermediate caches...');
// Try stopping any active Gradle daemon first to free memory and file locks
try {
  const gradlew = path.join(REPO_ROOT, 'apps/mobile/android/gradlew');
  if (fs.existsSync(gradlew)) {
    const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat --stop' : './gradlew --stop';
    execSync(gradlewCmd, { cwd: path.join(REPO_ROOT, 'apps/mobile/android'), stdio: 'ignore' });
    console.log('  ✓ Gradle daemon stopped');
  }
} catch {}

if (process.platform !== 'win32') {
  try {
    execSync("pkill -f 'GradleDaemon' || true", { stdio: 'ignore' });
  } catch {}
}

const androidCleanPaths = [
  path.join(REPO_ROOT, 'apps/mobile/android/app/build'),
  path.join(REPO_ROOT, 'apps/mobile/android/build'),
  path.join(REPO_ROOT, 'apps/mobile/modules/docchisel-bridge/android/build'),
  path.join(REPO_ROOT, 'apps/mobile/android/app/.cxx'),
  path.join(REPO_ROOT, 'apps/mobile/android/.cxx'),
  path.join(REPO_ROOT, 'apps/mobile/android/.gradle'),
  path.join(REPO_ROOT, 'apps/mobile/android/.kotlin'),
];
for (const p of androidCleanPaths) {
  removeSafe(p);
}

// 3. Clean Android native build caches inside node_modules
const nmDir = path.join(REPO_ROOT, 'node_modules');
if (fs.existsSync(nmDir)) {
  try {
    const pkgs = fs.readdirSync(nmDir);
    for (const pkg of pkgs) {
      const pkgPath = path.join(nmDir, pkg);
      if (pkg.startsWith('@')) {
        try {
          const subPkgs = fs.readdirSync(pkgPath);
          for (const sub of subPkgs) {
            cleanModuleAndroid(path.join(pkgPath, sub));
          }
        } catch {}
      } else {
        cleanModuleAndroid(pkgPath);
      }
    }
  } catch {}
}

function cleanModuleAndroid(moduleDir) {
  const androidBuild = path.join(moduleDir, 'android/build');
  const androidCxx = path.join(moduleDir, 'android/.cxx');
  if (fs.existsSync(androidBuild)) removeSafe(androidBuild, `${path.relative(REPO_ROOT, moduleDir)}/android/build`);
  if (fs.existsSync(androidCxx)) removeSafe(androidCxx, `${path.relative(REPO_ROOT, moduleDir)}/android/.cxx`);
}

// 4. iOS Build Artifacts & Intermediates
console.log('==> Cleaning iOS build artifacts & intermediates...');
removeSafe(path.join(REPO_ROOT, 'apps/mobile/ios/build'), 'Mobile iOS build directory');
removeSafe(path.join(REPO_ROOT, 'apps/mobile/ios/DerivedData'), 'Mobile iOS DerivedData');
removeSafe(path.join(REPO_ROOT, 'apps/mobile/ios/Pods'), 'Mobile iOS CocoaPods directory');
removeSafe(path.join(REPO_ROOT, 'apps/mobile/modules/docchisel-bridge/ios/libcore_engine.a'), 'Mobile iOS static library');
removeSafe(path.join(REPO_ROOT, 'target/aarch64-apple-ios-sim'), 'iOS simulator Rust build cache');
removeSafe(path.join(REPO_ROOT, 'target/aarch64-apple-ios'), 'iOS device Rust build cache');
removeSafe(path.join(REPO_ROOT, 'target/x86_64-apple-ios'), 'iOS x86_64 Rust build cache');
for (const plat of ['android', 'macos', 'windows', 'linux', 'ios']) {
  const platReleasesDir = path.join(REPO_ROOT, 'releases', plat);
  if (fs.existsSync(platReleasesDir) && fs.readdirSync(platReleasesDir).length === 0) {
    removeSafe(platReleasesDir, `Empty releases/${plat} directory`);
  }
}

// 5. Vite & Expo Bundler Caches
console.log('==> Cleaning Vite & Expo bundler caches...');
const bundlerPaths = [
  path.join(REPO_ROOT, 'apps/mobile/.expo'),
  path.join(REPO_ROOT, 'apps/desktop/dist'),
  path.join(REPO_ROOT, 'apps/desktop/node_modules/.vite'),
  path.join(REPO_ROOT, 'apps/desktop/node_modules/.vite-temp'),
  path.join(REPO_ROOT, 'apps/desktop/apps'),
  path.join(REPO_ROOT, '.expo'),
];
for (const p of bundlerPaths) {
  removeSafe(p);
}

// 6. Deep mode: Clean releases directory
if (isDeep) {
  console.log('==> Deep Mode: Removing releases directory...');
  removeSafe(path.join(REPO_ROOT, 'releases'), 'Releases directory');
}

console.log('\n✅ Cleanup Complete!\n==================================================');
