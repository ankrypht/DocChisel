import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DESKTOP_DIR = path.join(REPO_ROOT, 'apps/desktop');

const args = process.argv.slice(2);

// Platform selection flags
const platformIndex = args.indexOf('--platform');
const platformVal = platformIndex !== -1 ? args[platformIndex + 1]?.toLowerCase() : null;

const isMacUniversal = args.includes('--mac-universal') || (platformVal === 'mac' && args.includes('--universal'));
const isMac = args.includes('--mac') || isMacUniversal || platformVal === 'mac' || platformVal === 'macos';
const isWindows = args.includes('--windows') || args.includes('--win') || platformVal === 'windows' || platformVal === 'win';
const isLinuxDeb = args.includes('--linux-deb') || (platformVal === 'linux' && args.includes('--deb'));
const isLinuxAppImage = args.includes('--linux-appimage') || (platformVal === 'linux' && args.includes('--appimage'));
const isLinux = args.includes('--linux') || isLinuxDeb || isLinuxAppImage || platformVal === 'linux';
const isAll = args.includes('--all') || platformVal === 'all';

// Linux architecture mappings (64-bit and 32-bit for both AMD and ARM)
const LINUX_ARCH_MAP = {
  amd64: { target: 'x86_64-unknown-linux-gnu', label: '64-bit AMD/Intel (x86_64 / amd64)', debArch: 'amd64', appImageArch: 'amd64' },
  x64: { target: 'x86_64-unknown-linux-gnu', label: '64-bit AMD/Intel (x86_64 / amd64)', debArch: 'amd64', appImageArch: 'amd64' },
  x86_64: { target: 'x86_64-unknown-linux-gnu', label: '64-bit AMD/Intel (x86_64 / amd64)', debArch: 'amd64', appImageArch: 'amd64' },

  i686: { target: 'i686-unknown-linux-gnu', label: '32-bit AMD/Intel (x86 / i686 / i386)', debArch: 'i386', appImageArch: 'i686' },
  i386: { target: 'i686-unknown-linux-gnu', label: '32-bit AMD/Intel (x86 / i686 / i386)', debArch: 'i386', appImageArch: 'i686' },
  x86: { target: 'i686-unknown-linux-gnu', label: '32-bit AMD/Intel (x86 / i686 / i386)', debArch: 'i386', appImageArch: 'i686' },
  ia32: { target: 'i686-unknown-linux-gnu', label: '32-bit AMD/Intel (x86 / i686 / i386)', debArch: 'i386', appImageArch: 'i686' },

  arm64: { target: 'aarch64-unknown-linux-gnu', label: '64-bit ARM (aarch64 / arm64)', debArch: 'arm64', appImageArch: 'arm64' },
  aarch64: { target: 'aarch64-unknown-linux-gnu', label: '64-bit ARM (aarch64 / arm64)', debArch: 'arm64', appImageArch: 'arm64' },

  armhf: { target: 'armv7-unknown-linux-gnueabihf', label: '32-bit ARM (armv7 / armhf)', debArch: 'armhf', appImageArch: 'armhf' },
  armv7: { target: 'armv7-unknown-linux-gnueabihf', label: '32-bit ARM (armv7 / armhf)', debArch: 'armhf', appImageArch: 'armhf' },
  arm: { target: 'armv7-unknown-linux-gnueabihf', label: '32-bit ARM (armv7 / armhf)', debArch: 'armhf', appImageArch: 'armhf' },
};

const archIndex = args.indexOf('--arch');
const archVal = archIndex !== -1 ? args[archIndex + 1]?.toLowerCase() : null;

const targetIndex = args.indexOf('--target');
const explicitTarget = targetIndex !== -1 ? args[targetIndex + 1] : null;

const isAllLinuxArch = args.includes('--all-arch') || args.includes('--all-linux-arch');
const isX64Arch = args.includes('--x64') || args.includes('--amd64') || args.includes('--x86_64');
const isX86Arch = args.includes('--x86') || args.includes('--i686') || args.includes('--i386');
const isArm64Arch = args.includes('--arm64') || args.includes('--aarch64');
const isArmhfArch = args.includes('--armhf') || args.includes('--armv7');

let selectedLinuxArchKey = null;
if (archVal && LINUX_ARCH_MAP[archVal]) selectedLinuxArchKey = archVal;
else if (isX64Arch) selectedLinuxArchKey = 'amd64';
else if (isX86Arch) selectedLinuxArchKey = 'i686';
else if (isArm64Arch) selectedLinuxArchKey = 'arm64';
else if (isArmhfArch) selectedLinuxArchKey = 'armhf';

const linuxArchFlagNames = [
  '--x64', '--amd64', '--x86_64',
  '--x86', '--i686', '--i386',
  '--arm64', '--aarch64',
  '--armhf', '--armv7',
  '--all-arch', '--all-linux-arch'
];

const isDebug = args.includes('--debug');
const passthroughArgs = args.filter((arg, i) => {
  if (arg === '--debug') return false;
  if (['--mac', '--mac-universal', '--universal', '--windows', '--win', '--linux', '--linux-deb', '--linux-appimage', '--all'].includes(arg)) return false;
  if (linuxArchFlagNames.includes(arg)) return false;
  if (arg === '--platform') return false;
  if (i > 0 && args[i - 1] === '--platform') return false;
  if (arg === '--arch') return false;
  if (i > 0 && args[i - 1] === '--arch') return false;
  if (arg === '--target') return false;
  if (i > 0 && args[i - 1] === '--target') return false;
  return true;
});

if (!isMac && !isWindows && !isLinux && !isAll) {
  console.error('==================================================');
  console.error('❌ Error: No desktop platform specified.');
  console.error('Please specify a desktop platform:');
  console.error('  • macOS (Universal): npm run desktop:package:mac-universal (or --mac-universal)');
  console.error('  • macOS (Host):      npm run desktop:package:mac           (or --mac)');
  console.error('  • Windows (NSIS):    npm run desktop:package:windows       (or --windows)');
  console.error('  • Linux (AppImage):  npm run desktop:package:linux         (or --linux)');
  console.error('  • All Available:     npm run desktop:package:all           (or --all)');
  console.error('  • Linux Options:     --arch <x64|x86|arm64|armhf> | --deb | --all-arch');
  console.error('  • Platform option:   node scripts/build-desktop.mjs --platform <mac|windows|linux|all>');
  console.error('==================================================');
  process.exit(1);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function commandExists(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runTauriBuild(tauriArgs, env = process.env) {
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  console.log(`\n==> Executing: ${npxCmd} ${tauriArgs.join(' ')}\n`);
  const res = spawnSync(npxCmd, tauriArgs, {
    cwd: DESKTOP_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  });
  return res.status === 0;
}

function findArtifacts(searchDirs, filterFn) {
  const found = [];
  for (const sDir of searchDirs) {
    if (fs.existsSync(sDir)) {
      try {
        const files = fs.readdirSync(sDir, { recursive: true });
        for (const f of files) {
          const fullPath = path.join(sDir, f);
          if (fs.statSync(fullPath).isFile() && filterFn(path.basename(fullPath), fullPath)) {
            found.push(fullPath);
          }
        }
      } catch {}
    }
  }
  return found;
}

console.log('==================================================');
console.log(`🖥️  [DocChisel] Building Desktop Application (${isDebug ? 'Debug' : 'Release'})`);
console.log(`   Host Platform: ${process.platform} (${process.arch})`);
if (isAll) console.log('   Target Filter: All supported desktop platforms');
else {
  if (isMac) console.log(`   Target Filter: macOS ${isMacUniversal ? '(Universal Apple Silicon + Intel)' : '(Host Architecture)'}`);
  if (isWindows) console.log('   Target Filter: Windows (NSIS Setup .exe)');
  if (isLinux) {
    const archLabel = isAllLinuxArch
      ? 'All 4 Architectures (64/32-bit AMD & ARM)'
      : (selectedLinuxArchKey ? LINUX_ARCH_MAP[selectedLinuxArchKey].label : (explicitTarget || 'Host Architecture'));
    console.log(`   Target Filter: Linux ${isLinuxDeb ? '(.deb only)' : (isLinuxAppImage ? '(.AppImage only)' : '(.deb + .AppImage)')} - [${archLabel}]`);
  }
}
console.log('==================================================');

const modeDir = isDebug ? 'debug' : 'release';
let buildSuccess = true;

// ----------------------------------------------------
// 1. macOS Build
// ----------------------------------------------------
if (isMac || isAll) {
  console.log('\n--------------------------------------------------');
  console.log(`🍎 Building macOS DMG Installer ${isMacUniversal ? '(Universal)' : ''}`);
  console.log('--------------------------------------------------');

  if (process.platform !== 'darwin') {
    if (isAll) {
      console.log('  ⚠️ Skipping macOS build (macOS DMG bundles must be built on macOS).');
    } else {
      console.error('❌ Error: macOS DMG bundles can only be built natively on macOS.');
      console.error('   Apple codesigning, hdiutil, and Cocoa frameworks require a macOS host.');
      process.exit(1);
    }
  } else {
    const tauriArgs = ['tauri', 'build', '--bundles', 'dmg'];
    if (isDebug) tauriArgs.push('--debug');

    if (isMacUniversal) {
      // Ensure both aarch64 and x86_64 targets are installed in rustup
      try {
        const installed = execSync('rustup target list --installed', { encoding: 'utf8' });
        if (!installed.includes('aarch64-apple-darwin')) {
          console.log('  ℹ️ Adding rustup target aarch64-apple-darwin...');
          execSync('rustup target add aarch64-apple-darwin', { stdio: 'inherit' });
        }
        if (!installed.includes('x86_64-apple-darwin')) {
          console.log('  ℹ️ Adding rustup target x86_64-apple-darwin...');
          execSync('rustup target add x86_64-apple-darwin', { stdio: 'inherit' });
        }
      } catch (err) {
        console.warn(`  ⚠️ Could not verify universal targets: ${err.message}`);
      }

      tauriArgs.push('--target', 'universal-apple-darwin');
    }

    tauriArgs.push(...passthroughArgs);

    const ok = runTauriBuild(tauriArgs);
    if (!ok) {
      console.error('\n❌ macOS build failed.');
      buildSuccess = false;
    } else {
      const searchDirs = [
        path.join(REPO_ROOT, 'target', isMacUniversal ? 'universal-apple-darwin' : '', modeDir, 'bundle/dmg'),
        path.join(DESKTOP_DIR, 'src-tauri/target', isMacUniversal ? 'universal-apple-darwin' : '', modeDir, 'bundle/dmg'),
        path.join(REPO_ROOT, 'target', modeDir, 'bundle/dmg'),
        path.join(DESKTOP_DIR, 'src-tauri/target', modeDir, 'bundle/dmg'),
      ];
      const dmgs = findArtifacts(searchDirs, (name) => name.toLowerCase().endsWith('.dmg'));
      if (dmgs.length > 0) {
        for (const dmg of dmgs) {
          const stats = fs.statSync(dmg);
          console.log(`  ✓ macOS DMG Generated: ${path.basename(dmg)} (${formatBytes(stats.size)})`);
        }
      }
    }
  }
}

// ----------------------------------------------------
// 2. Windows Build
// ----------------------------------------------------
if (isWindows || isAll) {
  console.log('\n--------------------------------------------------');
  console.log('🪟 Building Windows NSIS Setup Installer (.exe)');
  console.log('--------------------------------------------------');

  const env = { ...process.env };

  if (process.platform === 'win32') {
    // Native Windows compilation
    console.log('==> Running native Windows build with MSVC & NSIS...');
    const tauriArgs = ['tauri', 'build', '--bundles', 'nsis'];
    if (isDebug) tauriArgs.push('--debug');
    tauriArgs.push(...passthroughArgs);

    const ok = runTauriBuild(tauriArgs, env);
    if (!ok) {
      console.error('\n❌ Native Windows build failed.');
      buildSuccess = false;
    }
  } else {
    // Cross-compilation on macOS or Linux
    console.log('==> Running cross-compilation pipeline (cargo-xwin + makensis)...');

    // Verify makensis
    if (!commandExists('makensis')) {
      console.error('\n❌ makensis (NSIS) not found in PATH.');
      if (process.platform === 'darwin') {
        console.error('   Install via Homebrew: brew install makensis');
      } else {
        console.error('   Install via apt:      sudo apt update && sudo apt install -y nsis');
      }
      if (isAll) {
        buildSuccess = false;
      } else {
        process.exit(1);
      }
    } else {
      console.log('  ✓ makensis found');
    }

    // Verify cargo-xwin
    let hasCargoXwin = commandExists('cargo-xwin');
    if (!hasCargoXwin) {
      try {
        execSync('cargo xwin --version', { stdio: 'ignore' });
        hasCargoXwin = true;
      } catch {}
    }
    if (!hasCargoXwin) {
      console.error('\n❌ cargo-xwin not found.');
      console.error('   Install via Cargo: cargo install cargo-xwin');
      if (isAll) {
        buildSuccess = false;
      } else {
        process.exit(1);
      }
    } else {
      console.log('  ✓ cargo-xwin found');
    }

    // Locate LLVM tools (llvm-rc, lld-link)
    if (!commandExists('llvm-rc')) {
      const candidateDirs = [
        '/opt/homebrew/opt/llvm/bin',
        '/usr/local/opt/llvm/bin',
        '/usr/bin',
        '/usr/lib/llvm-19/bin',
        '/usr/lib/llvm-18/bin',
        '/usr/lib/llvm-17/bin',
        '/usr/lib/llvm-16/bin',
        '/usr/lib/llvm-15/bin',
        '/usr/lib/llvm-14/bin',
      ];
      try {
        if (fs.existsSync('/usr/lib')) {
          const llvmDirs = fs.readdirSync('/usr/lib').filter((d) => d.startsWith('llvm-'));
          for (const d of llvmDirs) {
            candidateDirs.push(path.join('/usr/lib', d, 'bin'));
          }
        }
      } catch {}
      try {
        const brewPrefix = execSync('brew --prefix llvm 2>/dev/null', { encoding: 'utf8' }).trim();
        if (brewPrefix) candidateDirs.unshift(path.join(brewPrefix, 'bin'));
      } catch {}

      let foundLlvmPath = null;
      for (const cDir of candidateDirs) {
        if (fs.existsSync(path.join(cDir, 'llvm-rc'))) {
          foundLlvmPath = cDir;
          break;
        }
      }

      if (foundLlvmPath) {
        env.PATH = `${foundLlvmPath}:${env.PATH || ''}`;
        console.log(`  ✓ Added LLVM tools to PATH from: ${foundLlvmPath}`);
      } else {
        console.error('\n❌ llvm-rc (part of LLVM) not found.');
        if (process.platform === 'darwin') {
          console.error('   Install via Homebrew: brew install llvm lld');
        } else {
          console.error('   Install via apt:      sudo apt update && sudo apt install -y llvm lld');
        }
        if (isAll) {
          buildSuccess = false;
        } else {
          process.exit(1);
        }
      }
    } else {
      console.log('  ✓ llvm-rc found in PATH');
    }

    // Verify Rust Windows target
    try {
      const installed = execSync('rustup target list --installed', { encoding: 'utf8' });
      if (!installed.includes('x86_64-pc-windows-msvc')) {
        console.log('  ℹ️ Adding rustup target x86_64-pc-windows-msvc...');
        execSync('rustup target add x86_64-pc-windows-msvc', { stdio: 'inherit' });
      } else {
        console.log('  ✓ Rust target x86_64-pc-windows-msvc installed');
      }
    } catch (err) {
      console.warn(`  ⚠️ Could not verify rustup targets: ${err.message}`);
    }

    // Inject CFLAGS for clang-cl
    const requiredCflag = '-msse4.1';
    if (!env.CFLAGS || !env.CFLAGS.includes(requiredCflag)) {
      env.CFLAGS = env.CFLAGS ? `${env.CFLAGS} ${requiredCflag}` : requiredCflag;
    }
    console.log(`  ✓ Configured CFLAGS="${env.CFLAGS}" for clang-cl MSVC target`);

    // Suppress LNK4099 debug info warnings for MSVC CRT static libraries in lld-link
    const requiredRustflag = '-C link-arg=/ignore:4099';
    if (!env.RUSTFLAGS || !env.RUSTFLAGS.includes(requiredRustflag)) {
      env.RUSTFLAGS = env.RUSTFLAGS ? `${env.RUSTFLAGS} ${requiredRustflag}` : requiredRustflag;
    }
    console.log(`  ✓ Configured RUSTFLAGS="${env.RUSTFLAGS}" for lld-link MSVC target`);

    // Execute Tauri build with cargo-xwin
    const tauriArgs = [
      'tauri',
      'build',
      '--runner',
      'cargo-xwin',
      '--target',
      'x86_64-pc-windows-msvc',
      '--bundles',
      'nsis',
    ];
    if (isDebug) tauriArgs.push('--debug');
    tauriArgs.push(...passthroughArgs);

    const ok = runTauriBuild(tauriArgs, env);
    if (!ok) {
      console.error('\n❌ Cross-compilation for Windows failed.');
      buildSuccess = false;
    }
  }

  // Check generated Windows installer
  const searchDirs = [
    path.join(REPO_ROOT, 'target/x86_64-pc-windows-msvc', modeDir, 'bundle/nsis'),
    path.join(DESKTOP_DIR, 'src-tauri/target/x86_64-pc-windows-msvc', modeDir, 'bundle/nsis'),
    path.join(REPO_ROOT, 'target', modeDir, 'bundle/nsis'),
    path.join(DESKTOP_DIR, 'src-tauri/target', modeDir, 'bundle/nsis'),
  ];
  const exes = findArtifacts(searchDirs, (name) => name.toLowerCase().endsWith('.exe'));
  if (exes.length > 0) {
    for (const exe of exes) {
      const stats = fs.statSync(exe);
      console.log(`  ✓ Windows NSIS Installer Generated: ${path.basename(exe)} (${formatBytes(stats.size)})`);
    }
  }
}

// ----------------------------------------------------
// 3. Linux Build
// ----------------------------------------------------
if (isLinux || (isAll && process.platform === 'linux')) {
  let bundleTypes = 'appimage';
  if (isLinuxDeb) bundleTypes = 'deb';
  if (args.includes('--all-formats') || args.includes('--all-bundles') || (isLinuxDeb && isLinuxAppImage)) bundleTypes = 'deb,appimage';

  console.log('\n--------------------------------------------------');
  console.log(`🐧 Building Linux Package (${bundleTypes === 'appimage' ? 'Universal AppImage' : (bundleTypes === 'deb' ? 'DEB only' : 'AppImage + DEB')})`);
  console.log('--------------------------------------------------');

  if (process.platform !== 'linux') {
    if (isAll) {
      console.log('  ⚠️ Skipping Linux build (Linux GUI packages require a Linux environment with WebKit2GTK).');
    } else {
      console.error('❌ Error: Linux desktop packages (.deb / .AppImage) can only be built natively on a Linux host.');
      console.error('   WebKit2GTK 4.1 and GTK3 are dynamic Linux system C libraries.');
      console.error('\nTo build Linux packages, run natively on Linux (Ubuntu, Debian, Fedora, Arch Linux, etc.).');
      process.exit(1);
    }
  } else {
    // Verify WebKitGTK / GTK3 dependencies
    if (commandExists('pkg-config')) {
      try {
        execSync('pkg-config --exists webkit2gtk-4.1', { stdio: 'ignore' });
        console.log('  ✓ WebKit2GTK 4.1 development libraries found');
      } catch {
        console.warn('  ⚠️ Warning: pkg-config could not locate webkit2gtk-4.1.');
        console.warn('     If build fails, install via: sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev');
      }
    }



    // Determine target architectures to compile
    const targetsToBuild = [];
    if (isAllLinuxArch) {
      targetsToBuild.push(
        LINUX_ARCH_MAP['amd64'],
        LINUX_ARCH_MAP['i686'],
        LINUX_ARCH_MAP['arm64'],
        LINUX_ARCH_MAP['armhf']
      );
    } else if (selectedLinuxArchKey) {
      targetsToBuild.push(LINUX_ARCH_MAP[selectedLinuxArchKey]);
    } else if (explicitTarget) {
      targetsToBuild.push({ target: explicitTarget, label: explicitTarget });
    } else {
      targetsToBuild.push({ target: null, label: `Host Architecture (${process.arch})` });
    }

    for (const tConfig of targetsToBuild) {
      console.log(`\n==> Packaging for Linux Architecture: [${tConfig.label}]`);

      // Auto-verify and add rustup target if cross-compiling
      if (tConfig.target && commandExists('rustup')) {
        try {
          const installed = execSync('rustup target list --installed', { encoding: 'utf8' });
          if (!installed.includes(tConfig.target)) {
            console.log(`  ℹ️ Adding missing rustup target: ${tConfig.target}...`);
            execSync(`rustup target add ${tConfig.target}`, { stdio: 'inherit' });
          }
        } catch (err) {
          console.warn(`  ⚠️ Could not verify rustup target ${tConfig.target}: ${err.message}`);
        }
      }

      const tauriArgs = ['tauri', 'build', '--bundles', bundleTypes];
      if (tConfig.target) {
        tauriArgs.push('--target', tConfig.target);
      }
      if (isDebug) tauriArgs.push('--debug');
      tauriArgs.push(...passthroughArgs);

      const ok = runTauriBuild(tauriArgs);
      if (!ok) {
        console.error(`\n❌ Linux build failed for ${tConfig.label}.`);
        buildSuccess = false;
      }
    }

    // Locate all generated Linux packages across host and target bundle paths
    const searchDirs = [
      path.join(REPO_ROOT, 'target', modeDir, 'bundle/deb'),
      path.join(DESKTOP_DIR, 'src-tauri/target', modeDir, 'bundle/deb'),
      path.join(REPO_ROOT, 'target', modeDir, 'bundle/appimage'),
      path.join(DESKTOP_DIR, 'src-tauri/target', modeDir, 'bundle/appimage'),
    ];

    const knownLinuxTriples = [
      'x86_64-unknown-linux-gnu',
      'i686-unknown-linux-gnu',
      'aarch64-unknown-linux-gnu',
      'armv7-unknown-linux-gnueabihf'
    ];
    if (explicitTarget && !knownLinuxTriples.includes(explicitTarget)) {
      knownLinuxTriples.push(explicitTarget);
    }

    for (const triple of knownLinuxTriples) {
      searchDirs.push(
        path.join(REPO_ROOT, 'target', triple, modeDir, 'bundle/deb'),
        path.join(DESKTOP_DIR, 'src-tauri/target', triple, modeDir, 'bundle/deb'),
        path.join(REPO_ROOT, 'target', triple, modeDir, 'bundle/appimage'),
        path.join(DESKTOP_DIR, 'src-tauri/target', triple, modeDir, 'bundle/appimage')
      );
    }

    const linuxPackages = findArtifacts(searchDirs, (name) => name.toLowerCase().endsWith('.deb') || name.toLowerCase().endsWith('.appimage'));
    if (linuxPackages.length > 0) {
      const seen = new Set();
      for (const pkg of linuxPackages) {
        const base = path.basename(pkg);
        if (!seen.has(base)) {
          const stats = fs.statSync(pkg);
          console.log(`  ✓ Linux Package Generated: ${base} (${formatBytes(stats.size)})`);
          seen.add(base);
        }
      }
    }
  }
}

console.log('\n==================================================');
if (buildSuccess) {
  console.log('🎉 Desktop Packaging Finished Successfully!');
  console.log('To collect all binaries into the unified releases/ directory:');
  console.log('   npm run package:artifacts');
} else {
  console.error('❌ One or more desktop builds encountered errors.');
  process.exit(1);
}
console.log('==================================================\n');
