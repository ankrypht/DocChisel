import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Dynamically read version from root package.json
const pkgJsonPath = path.join(REPO_ROOT, 'package.json');
let version = '0.1.0';
try {
  const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  if (pkgData.version) {
    version = pkgData.version;
  }
} catch (err) {
  console.warn(`⚠️ Warning: Could not read package.json version, falling back to ${version}: ${err.message}`);
}

const destDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(REPO_ROOT, 'releases');

console.log('==================================================');
console.log('📦 [DocChisel] Collecting Lean Release Artifacts');
console.log(`   Version:     v${version}`);
console.log(`   Destination: ${destDir}`);
console.log('==================================================');

const platforms = ['android', 'macos', 'windows', 'linux', 'ios'];
fs.mkdirSync(destDir, { recursive: true });

let count = 0;

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function recordFile(src, destSubdir, explicitName = null) {
  const filename = explicitName || path.basename(src);
  const targetSubdir = path.join(destDir, destSubdir);
  fs.mkdirSync(targetSubdir, { recursive: true });
  const targetPath = path.join(targetSubdir, filename);
  fs.copyFileSync(src, targetPath);
  const stats = fs.statSync(targetPath);
  console.log(`  ✓ [${destSubdir}] ${filename} (${formatBytes(stats.size)})`);
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

// 1. Android Releases (Only arm64-v8a, armeabi-v7a, universal APKs, and release .aab)
console.log('==> Checking for Android release artifacts...');
const apkDir = path.join(REPO_ROOT, 'apps/mobile/android/app/build/outputs/apk');
const bundleDir = path.join(REPO_ROOT, 'apps/mobile/android/app/build/outputs/bundle');

let foundAndroidRelease = false;

if (fs.existsSync(apkDir)) {
  const allApks = findFilesRecursive(apkDir, (name) => name.endsWith('.apk'));

  // Prioritize release APKs
  const releaseApks = allApks.filter((p) => p.toLowerCase().includes('release'));
  const apksToProcess = releaseApks.length > 0 ? releaseApks : allApks;

  for (const apkPath of apksToProcess) {
    const name = path.basename(apkPath).toLowerCase();

    // Explicitly DROP x86 (32-bit) and standalone x86_64 split APKs
    if (name.includes('x86')) {
      continue;
    }

    if (name.includes('arm64-v8a')) {
      recordFile(apkPath, 'android', `DocChisel-${version}-arm64-v8a-release.apk`);
      foundAndroidRelease = true;
    } else if (name.includes('armeabi-v7a')) {
      recordFile(apkPath, 'android', `DocChisel-${version}-armeabi-v7a-release.apk`);
      foundAndroidRelease = true;
    } else if (name.includes('universal')) {
      recordFile(apkPath, 'android', `DocChisel-${version}-universal-release.apk`);
      foundAndroidRelease = true;
    } else if (name.includes('release') && !name.includes('unspecified')) {
      // In case AGP built a non-split monolithic release APK
      recordFile(apkPath, 'android', `DocChisel-${version}-universal-release.apk`);
      foundAndroidRelease = true;
    }
  }
}

if (fs.existsSync(bundleDir)) {
  const bundles = findFilesRecursive(bundleDir, (name) => name.endsWith('.aab'));
  for (const bundlePath of bundles) {
    recordFile(bundlePath, 'android', `DocChisel-${version}-release.aab`);
    foundAndroidRelease = true;
  }
}

// Immediately reclaim Android intermediate disk space if release artifacts were found
if (foundAndroidRelease) {
  try {
    const intermediates = path.join(REPO_ROOT, 'apps/mobile/android/app/build/intermediates');
    const cxx = path.join(REPO_ROOT, 'apps/mobile/android/app/.cxx');
    if (fs.existsSync(intermediates)) fs.rmSync(intermediates, { recursive: true, force: true });
    if (fs.existsSync(cxx)) fs.rmSync(cxx, { recursive: true, force: true });
    console.log('  ✓ Reclaimed Android intermediate build disk space');
  } catch {}
}

// 2. macOS Desktop (DMG installer ONLY; NEVER loose .app folder)
console.log('==> Checking for macOS bundles...');
const desktopSearchDirs = [
  path.join(REPO_ROOT, 'target'),
  path.join(REPO_ROOT, 'apps/desktop/src-tauri/target'),
];

let foundMacUniversal = false;
const dmgCandidates = [];

for (const sDir of desktopSearchDirs) {
  for (const file of findFilesRecursive(sDir, (name) => name.endsWith('.dmg'))) {
    dmgCandidates.push(file);
    if (file.toLowerCase().includes('universal')) {
      foundMacUniversal = true;
    }
  }
}

if (foundMacUniversal) {
  // Collect only the universal DMG
  for (const dmg of dmgCandidates) {
    if (dmg.toLowerCase().includes('universal')) {
      recordFile(dmg, 'macos', `DocChisel_${version}_universal.dmg`);
    }
  }
} else {
  // Fall back to host-architecture DMG if universal DMG wasn't generated
  for (const dmg of dmgCandidates) {
    const base = path.basename(dmg);
    const arch = base.includes('aarch64') ? 'aarch64' : (base.includes('x86_64') ? 'x86_64' : '');
    const finalName = arch ? `DocChisel_${version}_${arch}.dmg` : `DocChisel_${version}.dmg`;
    recordFile(dmg, 'macos', finalName);
  }
}

// 3. Windows Desktop (NSIS .exe setup ONLY; NEVER .msi)
console.log('==> Checking for Windows installers...');
for (const sDir of desktopSearchDirs) {
  const winInstallers = findFilesRecursive(sDir, (name, fullPath) => {
    const lower = name.toLowerCase();
    const fullLower = fullPath.replace(/\\/g, '/').toLowerCase();
    // Match NSIS setup executable only; drop .msi
    return (lower.endsWith('.exe') && (lower.includes('setup') || fullLower.includes('/nsis/')));
  });

  for (const exePath of winInstallers) {
    recordFile(exePath, 'windows', `DocChisel_${version}_x64-setup.exe`);
  }
}

// 4. Linux Desktop (.deb and .AppImage across 64-bit & 32-bit AMD/ARM; NEVER .rpm)
console.log('==> Checking for Linux packages (64-bit & 32-bit AMD and ARM)...');
const collectedLinuxDebs = new Set();
const collectedLinuxAppImages = new Set();

for (const sDir of desktopSearchDirs) {
  // DEB package
  const debs = findFilesRecursive(sDir, (name) => name.toLowerCase().endsWith('.deb'));
  for (const deb of debs) {
    const base = path.basename(deb).toLowerCase();
    const full = deb.replace(/\\/g, '/').toLowerCase();

    let arch = 'amd64';
    if (base.includes('arm64') || base.includes('aarch64') || full.includes('aarch64-unknown-linux-gnu')) {
      arch = 'arm64';
    } else if (base.includes('armhf') || base.includes('armv7') || full.includes('armv7-unknown-linux-gnueabihf')) {
      arch = 'armhf';
    } else if (base.includes('i386') || base.includes('i686') || (base.includes('x86') && !base.includes('x86_64')) || full.includes('i686-unknown-linux-gnu')) {
      arch = 'i386';
    } else if (base.includes('amd64') || base.includes('x86_64') || full.includes('x86_64-unknown-linux-gnu')) {
      arch = 'amd64';
    } else {
      if (process.arch === 'arm64') arch = 'arm64';
      else if (process.arch === 'arm') arch = 'armhf';
      else if (process.arch === 'ia32') arch = 'i386';
      else arch = 'amd64';
    }

    const finalName = `DocChisel_${version}_${arch}.deb`;
    if (!collectedLinuxDebs.has(finalName)) {
      recordFile(deb, 'linux', finalName);
      collectedLinuxDebs.add(finalName);
    }
  }

  // AppImage
  const appImages = findFilesRecursive(sDir, (name) => name.toLowerCase().endsWith('.appimage'));
  for (const appImage of appImages) {
    const base = path.basename(appImage).toLowerCase();
    const full = appImage.replace(/\\/g, '/').toLowerCase();

    let arch = 'x86_64';
    if (base.includes('arm64') || base.includes('aarch64') || full.includes('aarch64-unknown-linux-gnu')) {
      arch = 'arm64';
    } else if (base.includes('armhf') || base.includes('armv7') || full.includes('armv7-unknown-linux-gnueabihf')) {
      arch = 'armhf';
    } else if (base.includes('i386') || base.includes('i686') || (base.includes('x86') && !base.includes('x86_64')) || full.includes('i686-unknown-linux-gnu')) {
      arch = 'i686';
    } else if (base.includes('amd64') || base.includes('x86_64') || full.includes('x86_64-unknown-linux-gnu')) {
      arch = 'x86_64';
    } else {
      if (process.arch === 'arm64') arch = 'arm64';
      else if (process.arch === 'arm') arch = 'armhf';
      else if (process.arch === 'ia32') arch = 'i686';
      else arch = 'x86_64';
    }

    const finalName = `DocChisel_${version}_${arch}.AppImage`;
    if (!collectedLinuxAppImages.has(finalName)) {
      recordFile(appImage, 'linux', finalName);
      collectedLinuxAppImages.add(finalName);
    }
  }
}

// 5. iOS (.ipa) - Optional & Untested
console.log('==> Checking for iOS builds (optional / untested)...');
const iosSearchDirs = [
  path.join(REPO_ROOT, 'apps/mobile/ios/build'),
  path.join(REPO_ROOT, 'apps/mobile'),
];
let foundIos = false;
for (const iDir of iosSearchDirs) {
  for (const file of findFilesRecursive(iDir, (name) => name.endsWith('.ipa'), 5)) {
    recordFile(file, 'ios', `DocChisel_${version}.ipa`);
    foundIos = true;
  }
}
if (!foundIos) {
  console.log('  ℹ️ No iOS builds found (iOS build pipeline is preserved but untested & unreleased).');
}

// Post-collection auto-prune of disposable intermediate scratch caches
try {
  const pruneScript = path.join(REPO_ROOT, 'scripts/prune-intermediates.mjs');
  if (fs.existsSync(pruneScript)) {
    spawnSync('node', [pruneScript], { cwd: REPO_ROOT, stdio: 'inherit' });
  }
} catch {}

console.log('');
if (count > 0) {
  console.log('==================================================');
  console.log(`🎉 Successfully gathered ${count} finalized artifact(s) into:`);
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
  console.log('\nTo build finalized artifacts:');
  console.log('  • Android APKs (3):  npm run mobile:build:apk-release');
  console.log('  • Android AAB:       npm run mobile:build:bundle');
  console.log('  • macOS Universal:   npm run desktop:package:mac-universal');
  console.log('  • Windows NSIS:      npm run desktop:package:windows');
  console.log('  • Linux DEB/AppImage:npm run desktop:package:linux');
  console.log('  • All Desktop:       npm run desktop:package:all');
  console.log('\nAfter building, collect all binaries with:');
  console.log('  • npm run package:artifacts');
  console.log('==================================================');
}
