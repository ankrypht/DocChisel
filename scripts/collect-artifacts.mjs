import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const destDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(REPO_ROOT, 'releases');

console.log('==================================================');
console.log('📦 [DocChisel] Collecting Release Artifacts');
console.log(`   Destination: ${destDir}`);
console.log('==================================================');

const platforms = ['android', 'macos', 'windows', 'ios'];
for (const plat of platforms) {
  fs.mkdirSync(path.join(destDir, plat), { recursive: true });
}

let count = 0;

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function recordFile(src, destSubdir) {
  const filename = path.basename(src);
  const targetPath = path.join(destDir, destSubdir, filename);
  fs.copyFileSync(src, targetPath);
  const stats = fs.statSync(targetPath);
  console.log(`  ✓ [${destSubdir}] ${filename} (${formatBytes(stats.size)})`);
  count++;
}

function recordDirectory(srcDir, destSubdir) {
  const dirName = path.basename(srcDir);
  const targetDir = path.join(destDir, destSubdir, dirName);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.cpSync(srcDir, targetDir, { recursive: true });
  console.log(`  ✓ [${destSubdir}] ${dirName} (App Bundle Directory)`);
  count++;
}

function findFilesRecursive(dir, filterFn, maxDepth = 10, currentDepth = 0) {
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
  } catch {
    // Ignore permissions or transient read errors
  }
  return results;
}

function findDirsRecursive(dir, filterFn, maxDepth = 6, currentDepth = 0) {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return [];
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (filterFn(entry.name, fullPath)) {
          results.push(fullPath);
        } else {
          results.push(...findDirsRecursive(fullPath, filterFn, maxDepth, currentDepth + 1));
        }
      }
    }
  } catch {
    // Ignore permissions or transient read errors
  }
  return results;
}

// 1. Android APKs
console.log('==> Checking for Android APKs...');
const apkDir = path.join(REPO_ROOT, 'apps/mobile/android/app/build/outputs/apk');
for (const file of findFilesRecursive(apkDir, (name) => name.endsWith('.apk'))) {
  recordFile(file, 'android');
}

// 2. Android App Bundles (.aab)
console.log('==> Checking for Android App Bundles (.aab)...');
const bundleDir = path.join(REPO_ROOT, 'apps/mobile/android/app/build/outputs/bundle');
for (const file of findFilesRecursive(bundleDir, (name) => name.endsWith('.aab'))) {
  recordFile(file, 'android');
}

// 3. macOS Desktop (.dmg and .app bundle)
console.log('==> Checking for macOS bundles...');
const searchDirs = [
  path.join(REPO_ROOT, 'target'),
  path.join(REPO_ROOT, 'apps/desktop/src-tauri/target'),
];

for (const sDir of searchDirs) {
  // DMG installers
  for (const file of findFilesRecursive(sDir, (name) => name.endsWith('.dmg'))) {
    recordFile(file, 'macos');
  }
  // macOS .app bundles (under bundle/macos/)
  const appDirs = findDirsRecursive(sDir, (name, full) => {
    return name.endsWith('.app') && full.replace(/\\/g, '/').includes('/bundle/macos/');
  });
  for (const aDir of appDirs) {
    recordDirectory(aDir, 'macos');
  }
}

// 4. Windows Desktop (.msi and .exe installers)
console.log('==> Checking for Windows installers...');
for (const sDir of searchDirs) {
  const winInstallers = findFilesRecursive(sDir, (name) => {
    const lower = name.toLowerCase();
    return lower.endsWith('.msi') || (lower.endsWith('.exe') && lower.includes('setup'));
  });
  for (const file of winInstallers) {
    recordFile(file, 'windows');
  }
}

// 5. iOS (.ipa)
console.log('==> Checking for iOS builds...');
const iosSearchDirs = [
  path.join(REPO_ROOT, 'apps/mobile/ios/build'),
  path.join(REPO_ROOT, 'apps/mobile'),
];
for (const iDir of iosSearchDirs) {
  for (const file of findFilesRecursive(iDir, (name) => name.endsWith('.ipa'), 5)) {
    recordFile(file, 'ios');
  }
}

// Post-collection cleanup of disposable intermediate scratch caches
try {
  const pruneScript = path.join(REPO_ROOT, 'scripts/prune-intermediates.mjs');
  if (fs.existsSync(pruneScript)) {
    spawnSync('node', [pruneScript], { cwd: REPO_ROOT, stdio: 'inherit' });
  }
} catch {}

console.log('');
if (count > 0) {
  console.log('==================================================');
  console.log(`🎉 Successfully gathered ${count} artifact(s) into:`);
  console.log(`   ${destDir}`);
  console.log('==================================================');
  console.log('\n--- Released Files ---');
  for (const plat of platforms) {
    const pDir = path.join(destDir, plat);
    if (fs.existsSync(pDir)) {
      const entries = fs.readdirSync(pDir).filter((e) => !e.startsWith('.'));
      for (const e of entries) {
        const full = path.join(pDir, e);
        const stats = fs.statSync(full);
        const sizeStr = stats.isDirectory() ? 'Directory' : formatBytes(stats.size);
        console.log(`  • ${plat}/${e} (${sizeStr})`);
      }
    }
  }
  console.log('----------------------');
} else {
  console.log('ℹ️ No newly built artifacts found yet to collect.');
  console.log('\nTo build artifacts:');
  console.log('  • Android APK:      npm run mobile:build:apk-release');
  console.log('  • Android AAB:      npm run mobile:build:bundle');
  console.log('  • macOS Desktop:    npm run desktop:package:mac');
  console.log('  • Windows Desktop:  npm run desktop:package:windows');
  console.log('  • iOS App:          npm run mobile:ios:release');
  console.log('  • Or one-step:      npm run package:android / npm run package:mac / npm run package:windows');
  console.log('==================================================');
}
