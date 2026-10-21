import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

console.log('==================================================');
console.log('🧹 [DocChisel] Pruning Disposable Intermediate Build Caches');
console.log('==================================================');

let freedBytes = 0;
let prunedCount = 0;

function getDirectorySize(dirPath) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += getDirectorySize(full);
      } else if (entry.isFile()) {
        try {
          size += fs.statSync(full).size;
        } catch {}
      }
    }
  } catch {}
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function removeDirectory(targetPath, description) {
  try {
    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      let size = 0;
      if (stats.isDirectory()) {
        size = getDirectorySize(targetPath);
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        size = stats.size;
        fs.rmSync(targetPath, { force: true });
      }
      freedBytes += size;
      prunedCount++;
      const relative = path.relative(REPO_ROOT, targetPath);
      console.log(`  ✓ Removed ${description || relative} (${formatBytes(size)})`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Failed to remove ${targetPath}: ${err.message}`);
  }
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

// 1. Android Disposable Intermediates (preserves build/outputs with APK/AAB!)
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/android/app/build/intermediates'),
  'Android build intermediates (unstripped .so & dex scratchpad)'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/android/app/.cxx'),
  'Android app CMake/Ninja .cxx cache'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/android/.cxx'),
  'Android root CMake/Ninja .cxx cache'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/android/build'),
  'Android root project build cache'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/android/.kotlin'),
  'Android Kotlin daemon cache'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/modules/docchisel-bridge/android/build'),
  'docchisel-bridge Android build cache'
);

// 2. Scan and remove Android build caches inside node_modules
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
            checkAndPruneAndroid(path.join(pkgPath, sub));
          }
        } catch {}
      } else {
        checkAndPruneAndroid(pkgPath);
      }
    }
  } catch {}
}

function checkAndPruneAndroid(moduleDir) {
  const androidBuild = path.join(moduleDir, 'android/build');
  const androidCxx = path.join(moduleDir, 'android/.cxx');
  if (fs.existsSync(androidBuild)) {
    removeDirectory(androidBuild, `${path.relative(REPO_ROOT, moduleDir)}/android/build`);
  }
  if (fs.existsSync(androidCxx)) {
    removeDirectory(androidCxx, `${path.relative(REPO_ROOT, moduleDir)}/android/.cxx`);
  }
}

// 3. iOS Disposable Intermediates & Stray Artifacts
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/ios/build'),
  'iOS mobile build intermediates'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/ios/DerivedData'),
  'iOS DerivedData'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/ios/Pods'),
  'iOS CocoaPods directory'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/modules/docchisel-bridge/ios/libcore_engine.a'),
  'Stale iOS native static library'
);
removeDirectory(
  path.join(REPO_ROOT, 'target/aarch64-apple-ios-sim'),
  'iOS simulator Rust target cache'
);
removeDirectory(
  path.join(REPO_ROOT, 'target/aarch64-apple-ios'),
  'iOS device Rust target cache'
);
removeDirectory(
  path.join(REPO_ROOT, 'target/x86_64-apple-ios'),
  'iOS x86_64 Rust target cache'
);
for (const plat of ['android', 'macos', 'windows', 'linux', 'ios']) {
  const emptyPlatReleases = path.join(REPO_ROOT, 'releases', plat);
  if (fs.existsSync(emptyPlatReleases) && fs.readdirSync(emptyPlatReleases).length === 0) {
    removeDirectory(emptyPlatReleases, `Empty releases/${plat} folder`);
  }
}

// 4. Vite & Bundler Disposable Temp Files
removeDirectory(
  path.join(REPO_ROOT, 'apps/desktop/node_modules/.vite-temp'),
  'Desktop Vite temporary bundling cache'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/desktop/apps'),
  'Stray nested apps/desktop/apps folder'
);
removeDirectory(
  path.join(REPO_ROOT, 'apps/mobile/.expo'),
  'Mobile .expo cache'
);
removeDirectory(
  path.join(REPO_ROOT, '.expo'),
  'Root .expo cache'
);

// 5. Cargo Incremental Caches (safe throwaway caches)
const targetDir = path.join(REPO_ROOT, 'target');
if (fs.existsSync(targetDir)) {
  try {
    const findIncremental = (dir, depth = 0) => {
      if (depth > 4) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === 'incremental') {
              removeDirectory(full, `Cargo incremental cache: ${path.relative(REPO_ROOT, full)}`);
            } else {
              findIncremental(full, depth + 1);
            }
          }
        }
      } catch {}
    };
    findIncremental(targetDir);
  } catch {}
}

// 6. Stray OS Metadata (.DS_Store, Thumbs.db, desktop.ini)
try {
  purgeOsMetadata(REPO_ROOT);
  const gradleHome = process.env.GRADLE_USER_HOME ||
    (process.env.HOME ? path.join(process.env.HOME, '.gradle') : (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.gradle') : null));
  if (gradleHome && fs.existsSync(path.join(gradleHome, 'caches'))) {
    purgeOsMetadata(path.join(gradleHome, 'caches'));
  }
} catch {}

console.log('==================================================');
if (prunedCount > 0) {
  console.log(`✅ Pruned ${prunedCount} cache locations. Reclaimed ${formatBytes(freedBytes)}!`);
} else {
  console.log('✨ Build environment is already lean. No disposable intermediates found.');
}
console.log('==================================================\n');
