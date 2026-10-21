# DocChisel — Developer Setup, Build & Packaging Guide

This guide provides a comprehensive, step-by-step manual for setting up, developing, and packaging **DocChisel** across **macOS**, **Windows**, and **Linux** for all 5 target operating systems: **Android**, **Windows**, **macOS**, **Linux**, and **iOS**.

---

## 📑 Table of Contents

1. [Core Philosophy & Architecture](#-core-philosophy--architecture)
2. [Compatibility & Exclusivity Matrix (Native Host Builds Only)](#-compatibility--exclusivity-matrix-native-host-builds-only)
3. [Step 0: Initial Repository Setup (From the Very First)](#-step-0-initial-repository-setup-from-the-very-first)
4. [Development Host Setup Guides (The 3 Host OSes)](#-development-host-setup-guides-the-3-host-oses)
   - [macOS Development Host](#1-macos-development-host-apple-silicon--intel)
   - [Windows Development Host](#2-windows-development-host-windows-1011-x64)
   - [Linux Development Host](#3-linux-development-host-ubuntudebian-fedora-arch-opensuse)
5. [Target Platform Build & Run Guides (The 5 Target Platforms)](#-target-platform-build--run-guides-the-5-target-platforms)
   - [Target 1: Android (3 APKs + 1 AAB)](#target-1-android-apks--google-play-aab)
   - [Target 2: macOS (Universal DMG) — macOS Exclusive](#target-2-macos-universal-dmg--macos-exclusive)
   - [Target 3: Windows (NSIS Setup .exe)](#target-3-windows-nsis-setup-exe)
   - [Target 4: Linux (DEB & AppImage) — Linux Exclusive](#target-4-linux-deb--appimage--linux-exclusive)
   - [Target 5: iOS (.ipa & Simulator) — macOS Exclusive](#target-5-ios-ipa--simulator--macos-exclusive-untested)
6. [Brand Assets & Icon Generation Pipeline](#-brand-assets--icon-generation-pipeline)
7. [Unified Artifact Collection (`releases/`)](#-unified-artifact-collection-releases)
8. [Maintenance, Cleanup & Safeguards](#-maintenance-cleanup--safeguards)
9. [Convenience Scripts Reference](#-convenience-scripts-reference)
10. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 🏛️ Core Philosophy & Architecture

DocChisel is built on 3 invariant architectural rules:
1. **Single-Dispatcher Bridge**: Core Rust functionality is exposed via a single entry point (`execute_job`) accepting JSON payloads adhering to Zod schemas in `packages/shared`.
2. **Zero File Bytes Over IPC/FFI**: Never pass binary buffers, Base64 strings, or Uint8Array blobs across IPC or FFI. The frontend passes filesystem paths; Rust reads from and writes directly to disk.
3. **Permissive Open-Source Only**: Strictly 100% Apache-2.0 and MIT compliant (no AGPL/GPL crates like MuPDF or Ghostscript) ensuring seamless distribution on desktop and app stores.

---

## 🌐 Compatibility & Exclusivity Matrix (Native Host Builds Only)

DocChisel is engineered to run and build natively on developer workstations without requiring virtual machines, Docker containers, or cloud CI pipelines:

| Target Platform | Final Package Format | macOS Host | Windows Host | Linux Host | Architecture & Exclusivity Details |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Android** | 3 APKs + 1 AAB | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | **Native on all 3 hosts** using Android SDK, NDK, and `cargo-ndk`. |
| **Windows** | NSIS Setup `.exe` | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | **Native on Windows** (MSVC + NSIS); **Cross-compiled on macOS & Linux** via `cargo-xwin` + `makensis` + LLVM/LLD. |
| **macOS** | Universal `.dmg` | ✅ **Yes** | ❌ **No** | ❌ **No** | **macOS Exclusive**. Requires Apple Cocoa frameworks, codesigning, and `hdiutil` DMG creation. |
| **Linux** | `.deb` + `.AppImage` | ☁️ **GitHub Actions** | ☁️ **GitHub Actions** | ✅ **Yes** | **Linux Exclusive locally** (WebKit2GTK/GTK3). Automated across all 4 architectures via GitHub Actions (`build-linux.yml`). |
| **iOS** | `.ipa` / Simulator | ✅ **Yes** | ❌ **No** | ❌ **No** | **macOS Exclusive**. Requires Xcode and iOS SDKs (untested/unreleased). |

### Why Are Some Targets Exclusive?
- **macOS Exclusivity**: Apple Cocoa frameworks, codesigning notarization, and `hdiutil` disk image creation utilities exist solely in the Darwin/macOS operating system.
- **Linux Exclusivity**: Tauri on Linux relies on WebKit2GTK 4.1 and GTK3, which are dynamic Linux system C libraries linking with `glibc`, X11, and Wayland.
- **Windows Cross-Compilation**: Unlike Linux and macOS desktop apps, Windows binaries can be cross-compiled cleanly from macOS and Linux because `cargo-xwin` automatically retrieves and manages the MSVC CRT headers/libraries, and `makensis` runs cross-platform.

---

## 🚀 Step 0: Initial Repository Setup (From the Very First)

The following steps are identical across **macOS**, **Windows**, and **Linux**:

### 1. Install Common System Tools
- **Node.js**: Install Node.js LTS (`v24.x+`) from [nodejs.org](https://nodejs.org/).
- **Rust**: Install Rust via [rustup.rs](https://rustup.rs/):
  ```bash
  # macOS / Linux
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

  # Windows
  # Download and run rustup-init.exe from https://rustup.rs
  ```

### 2. Verify System Installations
Open a fresh terminal (Terminal on macOS/Linux, PowerShell or Command Prompt on Windows):
```bash
node -v
npm -v
rustc --version
cargo --version
```

### 3. Clone Repository & Install Workspaces
```bash
# 1. Clone repository
git clone https://github.com/ankrypht/DocChisel.git
cd DocChisel

# 2. Install dependencies across all monorepo workspaces
npm install

# 3. Verify TypeScript type safety and run the 12 Rust core engine tests
npm run check:all
```

---

## 🧰 Development Host Setup Guides (The 3 Host OSes)

### 1. macOS Development Host (Apple Silicon & Intel)

#### What to Install on macOS:
1. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
2. **Rust macOS Targets** (for Universal DMG):
   ```bash
   rustup target add aarch64-apple-darwin
   rustup target add x86_64-apple-darwin
   ```
3. **Android Development Tools**:
   - Download and install [Android Studio](https://developer.android.com/studio).
   - Install JDK 17 (required by Gradle, Expo & React Native):
     ```bash
     brew install openjdk@17
     ```
   - In Android Studio **SDK Manager**:
     - SDK Platforms: **Android 14 (API 34)** or **Android 15 (API 35)**.
     - SDK Tools: Android SDK Build-Tools, Android SDK Platform-Tools, CMake, and **NDK (Side by side)** version `26.x` or `27.x`.
   - Install `cargo-ndk` and Android Rust targets:
     ```bash
     cargo install cargo-ndk
     rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
     ```
   - Add environment variables to `~/.zshrc`:
     ```bash
     export ANDROID_HOME="$HOME/Library/Android/sdk"
     export JAVA_HOME="/opt/homebrew/opt/openjdk@17" # Use "/usr/local/opt/openjdk@17" for Intel Macs
     export PATH="$JAVA_HOME/bin:$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
     ```
4. **(Optional) Windows Cross-Compilation Toolchain on macOS**:
   To compile Windows NSIS `.exe` setup installers directly on macOS:
   ```bash
   brew install makensis llvm lld
   cargo install cargo-xwin
   rustup target add x86_64-pc-windows-msvc
   ```
5. **(Optional / Untested) iOS Mobile Toolchain**:
   - Install full Xcode from the Mac App Store.
   - Install CocoaPods: `brew install cocoapods`
   - Add iOS Rust targets:
     ```bash
     rustup target add aarch64-apple-ios aarch64-apple-ios-sim
     ```

---

### 2. Windows Development Host (Windows 10/11 x64)

#### What to Install on Windows:
1. **Visual Studio 2022 C++ Build Tools**:
   - Download [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
   - In the installer, select the workload: **"Desktop development with C++"**.
   - Ensure the following components are selected:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 10 SDK (or Windows 11 SDK)
     - C++ CMake tools for Windows
2. **WebView2 Runtime**:
   - Included by default on Windows 10/11. If missing, install the [Evergreen WebView2 Bootstrapper](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
3. **NSIS (Nullsoft Scriptable Install System)**:
   - Install via winget:
     ```powershell
     winget install NSIS.NSIS
     ```
   - Or download installer from [SourceForge](https://nsis.sourceforge.io/). Ensure `C:\Program Files (x86)\NSIS` is added to your system `PATH`.
4. **Set Rust Default MSVC Toolchain**:
   ```powershell
   rustup default stable-x86_64-pc-windows-msvc
   ```
5. **Android Development Tools**:
   - Install [Android Studio for Windows](https://developer.android.com/studio).
   - Install JDK 17 (required by Gradle, Expo & React Native):
     ```powershell
     winget install Microsoft.OpenJDK.17
     # or: winget install EclipseAdoptium.Temurin.17.JDK
     ```
   - In **SDK Manager**, install:
     - Android SDK Platform 34 or 35
     - Android SDK Build-Tools
     - NDK (`26.x` or `27.x`)
   - Install `cargo-ndk` and Android Rust targets:
     ```powershell
     cargo install cargo-ndk
     rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
     ```
   - Configure Environment Variables (System Properties -> Environment Variables):
     - `ANDROID_HOME`: `%LOCALAPPDATA%\Android\Sdk`
     - `JAVA_HOME`: `C:\Program Files\Microsoft\jdk-17.x.x-hotspot` (or your JDK 17 install directory)
     - Add to `PATH`: `%JAVA_HOME%\bin`, `%ANDROID_HOME%\platform-tools`, `%ANDROID_HOME%\emulator`

---

### 3. Linux Development Host (Ubuntu/Debian, Fedora, Arch, openSUSE)

#### What to Install on Linux:
1. **System & WebKitGTK Development Libraries**:
   - **Ubuntu / Debian (22.04 LTS, 24.04 LTS+)**:
     ```bash
     sudo apt update
     sudo apt install -y \
       libwebkit2gtk-4.1-dev \
       libgtk-3-dev \
       libgtk-3-bin \
       libglib2.0-bin \
       build-essential \
       curl \
       wget \
       file \
       libssl-dev \
       librsvg2-dev \
       librsvg2-common \
       pkg-config \
       patchelf \
       libfuse2
     ```
   - **Fedora (39, 40, 41+)**:
     ```bash
     sudo dnf install -y \
       webkit2gtk4.1-devel \
       gtk3-devel \
       openssl-devel \
       curl \
       wget \
       file \
       librsvg2-devel \
       pkg-config \
       patchelf \
       fuse-libs
     sudo dnf group install -y "c-development"
     ```
   - **Arch Linux / Manjaro**:
     ```bash
     sudo pacman -S --needed \
       webkit2gtk-4.1 \
       gtk3 \
       base-devel \
       curl \
       wget \
       file \
       openssl \
       librsvg \
       patchelf \
       pkgconf \
       fuse2
     ```
   - **openSUSE (Leap / Tumbleweed)**:
     ```bash
     sudo zypper refresh
     sudo zypper install -y \
       webkit2gtk4-devel \
       gtk3-devel \
       libopenssl-devel \
       curl \
       wget \
       file \
       librsvg-devel \
       pkg-config \
       patchelf \
       libfuse2
     sudo zypper install -t pattern devel_basis
     ```
   - **Rust Linux Targets**:
     ```bash
     # Install host target (auto-installed by rustup)
     # For cross-compiling or building across architectures on Linux:
     rustup target add x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu i686-unknown-linux-gnu armv7-unknown-linux-gnueabihf
     # (Optional: for local 32-bit multiarch cross-compilation on 64-bit Ubuntu/Debian):
     # - For 32-bit AMD/Intel (i686):
     #   sudo dpkg --add-architecture i386 && sudo apt install -y gcc-multilib g++-multilib libwebkit2gtk-4.1-dev:i386 libgtk-3-dev:i386 librsvg2-dev:i386 librsvg2-common:i386 libssl-dev:i386
     # - For 32-bit ARM (armhf):
     #   sudo dpkg --add-architecture armhf && sudo apt install -y gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf libwebkit2gtk-4.1-dev:armhf libgtk-3-dev:armhf librsvg2-dev:armhf librsvg2-common:armhf libssl-dev:armhf qemu-user-static binfmt-support
     ```
2. **Android Development Tools**:
   - Install [Android Studio for Linux](https://developer.android.com/studio).
   - Install JDK 17:
     ```bash
     sudo apt install -y openjdk-17-jdk   # Debian/Ubuntu
     # or: sudo dnf install -y java-17-openjdk-devel # Fedora
     # or: sudo pacman -S jdk17-openjdk  # Arch Linux
     ```
   - In Android Studio **SDK Manager**:
     - SDK Platforms: **Android 14 (API 34)** or **Android 15 (API 35)**.
     - SDK Tools: Android SDK Build-Tools, Android SDK Platform-Tools, CMake, and **NDK (Side by side)** version `26.x` or `27.x`.
   - Install `cargo-ndk` and Android Rust targets:
     ```bash
     cargo install cargo-ndk
     rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
     ```
   - Add environment variables to `~/.bashrc`:
     ```bash
     export ANDROID_HOME="$HOME/Android/Sdk"
     export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64" # Adjust path for Fedora/Arch if needed
     export PATH="$JAVA_HOME/bin:$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"
     ```
3. **(Optional) Windows Cross-Compilation Toolchain on Linux**:
   ```bash
   sudo apt install -y nsis llvm lld
   cargo install cargo-xwin
   rustup target add x86_64-pc-windows-msvc
   ```

---

## 🎯 Target Platform Build & Run Guides (The 5 Target Platforms)

### Target 1: Android (APKs & Google Play .AAB)

**Supported Development Hosts**: macOS, Windows, and Linux.

#### 1. Fast Local Development:
```bash
# Step 1: Build the native Rust engine for local Android dev (arm64-v8a fast compilation)
npm run mobile:build-engine:android

# Step 2: Start Expo Metro server
npm run mobile:start

# Step 3: Run on Android emulator or connected device (with USB debugging enabled)
npm run mobile:android
```
- **Hot Reload**: JavaScript and React Native UI updates instantly on the device via Expo Fast Refresh.
- **Reloading**: Press `r` in the terminal to reload; press `m` to open the developer menu.

#### 2. Production Release Packaging:
```bash
# Step 1: Compile the multi-architecture 16 KB page-size aligned native engine
npm run mobile:build-engine:android:release

# Step 2: Build the 3 release APKs (arm64-v8a, armeabi-v7a, universal)
npm run mobile:build:apk-release

# Step 3: Build the Google Play Store App Bundle (.aab)
npm run mobile:build:bundle
```
- **Output Files**:
  - `DocChisel-<version>-arm64-v8a-release.apk` (modern 64-bit phones)
  - `DocChisel-<version>-armeabi-v7a-release.apk` (legacy 32-bit phones)
  - `DocChisel-<version>-universal-release.apk` (all devices)
  - `DocChisel-<version>-release.aab` (Google Play Console)
- **Production Signing**: By default, builds use `debug.keystore` for frictionless local testing. For production upload, set the environment variables:
  ```bash
  export DOCCHISEL_UPLOAD_STORE_FILE="/path/to/my-upload-key.keystore"
  export DOCCHISEL_UPLOAD_STORE_PASSWORD="my-store-password"
  export DOCCHISEL_UPLOAD_KEY_ALIAS="my-key-alias"
  export DOCCHISEL_UPLOAD_KEY_PASSWORD="my-key-password"
  ```

---

### Target 2: macOS (Universal DMG) — macOS Exclusive

**Supported Development Host**: macOS ONLY.

#### 1. Local Development (with Hot Reload):
```bash
npm run desktop:dev
```
- Edits to React frontend in `apps/desktop/src/` update immediately via Vite HMR.
- Edits to Rust backend in `apps/desktop/src-tauri/` or `crates/core_engine/` trigger an automatic incremental Cargo recompile.

#### 2. Production Packaging:
```bash
# Primary Release: Universal DMG (Apple Silicon M1-M4 + Intel x86_64)
npm run desktop:package:mac-universal

# Or fast host-architecture DMG for quick local testing:
npm run desktop:package:mac
```
- **Output File**: `target/universal-apple-darwin/release/bundle/dmg/DocChisel_<version>_universal.dmg`
- **Safeguard**: Running this script on Windows or Linux will halt with an explicit notification explaining macOS exclusivity.

---

### Target 3: Windows (NSIS Setup .exe)

**Supported Development Hosts**:
- **Windows**: Native build with MSVC & NSIS.
- **macOS & Linux**: Cross-compiled via `cargo-xwin` + `makensis` + LLVM.

#### 1. Local Development on Windows (with Hot Reload):
```bash
npm run desktop:dev
```

#### 2. Production Packaging (Works on Windows, macOS, and Linux):
```bash
# Release Build
npm run desktop:package:windows

# Debug Build
npm run desktop:package:windows:debug
```
- **Output File**: `target/release/bundle/nsis/DocChisel_<version>_x64-setup.exe` (or in `target/x86_64-pc-windows-msvc/release/bundle/nsis/` when cross-compiled).
- **How Cross-Compilation Operates**:
  1. `scripts/build-desktop.mjs` automatically validates `makensis` and `cargo-xwin`.
  2. Discovers `llvm-rc` and `lld-link` (from Homebrew on macOS or `/usr/lib/llvm-*/bin` on Linux).
  3. Ensures the `x86_64-pc-windows-msvc` target is added via rustup.
  4. Automatically sets `CFLAGS="-msse4.1"` for clang-cl SIMD compatibility.
  5. Invokes Tauri with the `cargo-xwin` runner to produce the `.exe`.

---

### Target 4: Linux (DEB & AppImage) — Linux Exclusive

**Supported Development Host**: Linux ONLY.

#### 1. Local Development on Linux (with Hot Reload):
```bash
npm run desktop:dev
```

#### 2. Production Packaging:
```bash
# Build both the universal standalone AppImage and Debian package for your host architecture:
npm run desktop:package:linux

# Specific architecture shortcuts:
npm run desktop:package:linux:x64      # 64-bit AMD/Intel (.deb + .AppImage)
npm run desktop:package:linux:arm64    # 64-bit ARM (.deb + .AppImage)
npm run desktop:package:linux:x86      # 32-bit AMD/Intel (.deb + .AppImage)
npm run desktop:package:linux:armhf    # 32-bit ARM (.deb + .AppImage)
npm run desktop:package:linux:all      # All 4 architectures

# Single-format options (optional):
# npm run desktop:package:linux -- --deb       # .deb package only
# npm run desktop:package:linux -- --appimage  # .AppImage only
```
- **Universal Output Format**:
  - **64-bit AMD/Intel**: `DocChisel_<version>_x86_64.AppImage` and `DocChisel_<version>_amd64.deb`
  - **32-bit AMD/Intel**: `DocChisel_<version>_i686.AppImage` and `DocChisel_<version>_i386.deb`
  - **64-bit ARM**: `DocChisel_<version>_arm64.AppImage` and `DocChisel_<version>_arm64.deb`
  - **32-bit ARM**: `DocChisel_<version>_armhf.AppImage` and `DocChisel_<version>_armhf.deb`
- **Installing & Running on ANY Linux Distribution**:
  AppImages are self-contained and distribution-agnostic (Ubuntu, Debian, Fedora, Arch, openSUSE, Mint, etc.):
  ```bash
  # AppImage (runs everywhere):
  chmod +x DocChisel_*_*.AppImage
  ./DocChisel_*_*.AppImage

  # Debian/Ubuntu (.deb if built):
  sudo apt install ./DocChisel_*_*.deb
  ```

> [!IMPORTANT]
> **Building Linux Packages from macOS / Windows without Local VMs or Docker**:
> Because Linux GUI packages link dynamically against WebKit2GTK 4.1 and GTK3 C libraries, local macOS and Windows machines cannot compile native Linux packages directly.
> 
> **Solution: Automated GitHub Actions Workflow**
> A ready-to-run GitHub Actions workflow (`.github/workflows/build-linux.yml`) compiles both `.deb` and `.AppImage` packages across all 4 architectures in the cloud and bundles them for download:
> - **64-bit AMD/Intel**: `DocChisel_<version>_x86_64.AppImage` & `DocChisel_<version>_amd64.deb` (native `ubuntu-22.04` runner)
> - **64-bit ARM**: `DocChisel_<version>_arm64.AppImage` & `DocChisel_<version>_arm64.deb` (native `ubuntu-24.04-arm` runner)
> - **32-bit AMD/Intel**: `DocChisel_<version>_i686.AppImage` & `DocChisel_<version>_i386.deb` (32-bit multiarch on `ubuntu-22.04`)
> - **32-bit ARM**: `DocChisel_<version>_armhf.AppImage` & `DocChisel_<version>_armhf.deb` (cross-toolchain + QEMU + native appimagetool packaging on `ubuntu-22.04`)
> 
> **How to Trigger & Download**:
> 1. In GitHub, go to **Actions** → **Build Linux Packages (.deb & AppImage)** → **Run workflow**.
> 2. Once completed, download `docchisel-linux-all-v<version>.zip` directly from the workflow run page (under **Artifacts**).
> 3. Alternatively, run `npm run linux:download` locally to automatically fetch and place the files into `releases/linux/`.

- **Safeguard**: Running this script on macOS or Windows will halt with an explicit notification explaining Linux exclusivity.

---

### Target 5: iOS (.ipa & Simulator) — macOS Exclusive (Untested)

**Supported Development Host**: macOS with Xcode.

> [!NOTE]
> **Status: Untested & Unreleased**: The complete mobile architecture, Swift UniFFI bridge, and Expo configuration remain fully intact in the repository. The iOS pipeline is preserved for future activation pending Apple Developer App Store account enrollment.

```bash
# Compile native engine for iOS Simulator
npm run mobile:build-engine:ios

# Run on iOS Simulator
npm run mobile:ios

# Compile release configuration:
npm run mobile:build-engine:ios:release
npm run mobile:ios:release
```

---

## 🎨 Brand Assets & Icon Generation Pipeline

DocChisel uses an **SVG-first architecture**. All platform graphics originate from mathematical curves in `assets/brand/*.svg`:
- `desktop-app-icon.svg`: Master desktop square icon.
- `adaptive-foreground.svg`: Android adaptive launcher foreground.
- `adaptive-monochrome.svg`: Android 13+ Material You themed silhouette.
- `splash-icon.svg`: Application launch logo.

### Generating All Platform Assets:
```bash
npm run generate:icons
```
DocChisel's `scripts/generate-icons.mjs` is written in 100% pure Node.js and automatically:
1. Rasterizes vector SVGs to crisp high-DPI bitmaps using Skia (`@napi-rs/canvas`).
2. Generates desktop `icon.icns` (Retina macOS) and `icon.ico` (Win32 multi-resolution container).
3. Generates Windows Store modern tiles (`Square44x44`, `Square150x150`, `Square310x310`, `StoreLogo`).
4. Generates iOS 24-bit RGB PNGs (strictly 0% alpha for App Store compliance).
5. Generates Android adaptive WebP mipmaps across `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi`, plus splash drawables.

---

## 🎯 Unified Artifact Collection (`releases/`)

To prevent developers from having to locate nested build outputs, DocChisel provides a centralized collector:

```bash
npm run package:artifacts
```

### What this does:
1. Scans build trees across all target platforms.
2. Copies and renames finalized binaries into a clean structure at `<repo_root>/releases`:
   ```
   releases/
   ├── android/
   │   ├── DocChisel-<version>-arm64-v8a-release.apk
   │   ├── DocChisel-<version>-armeabi-v7a-release.apk
   │   ├── DocChisel-<version>-universal-release.apk
   │   └── DocChisel-<version>-release.aab
   ├── macos/
   │   └── DocChisel_<version>_universal.dmg
   ├── windows/
   │   └── DocChisel_<version>_x64-setup.exe
   └── linux/
       ├── DocChisel_<version>_x86_64.AppImage
       ├── DocChisel_<version>_amd64.deb
       ├── DocChisel_<version>_i386.deb
       ├── DocChisel_<version>_i686.AppImage
       ├── DocChisel_<version>_arm64.deb
       ├── DocChisel_<version>_arm64.AppImage
       ├── DocChisel_<version>_armhf.deb
       └── DocChisel_<version>_armhf.AppImage
   ```
3. Automatically runs intermediate cache pruning to reclaim disk space.

---

## 🧹 Maintenance, Cleanup & Safeguards

Cross-platform builds can generate gigabytes of compiler scratchpads. DocChisel includes a 3-tier maintenance suite:

```bash
# 1. Instant Safe Prune:
# Deletes intermediate scratchpads (.cxx, Android intermediates, Cargo incremental caches)
# without deleting built APKs, DMGs, or release binaries. Reclaims 5–15 GB instantly!
npm run prune
# or: npm run clean:intermediates

# 2. Standard Clean:
# Stops Gradle daemons, cleans Cargo target, Android, iOS & Expo caches
npm run clean

# 3. Deep Clean:
# Performs a standard clean plus wipes the releases/ directory
npm run clean:deep

# 4. Targeted Cleans:
npm run desktop:clean          # Cleans Desktop Vite and Tauri targets
npm run mobile:clean:android   # Stops Gradle daemon and wipes Android build trees
npm run mobile:clean:ios       # Wipes iOS DerivedData and Pods
npm run mobile:clean:all       # Wipes all mobile caches
```

---

## ⚡ Convenience Scripts Reference

| Command | Platform | Description |
| :--- | :--- | :--- |
| `npm run desktop:dev` | macOS, Win, Linux | Starts Tauri desktop app with hot reload |
| `npm run desktop:dev:web` | Any | Runs browser preview on http://localhost:1420 |
| `npm run desktop:package:mac-universal` | macOS Only | Packages Universal macOS DMG installer |
| `npm run desktop:package:mac` | macOS Only | Packages Host-arch macOS DMG installer |
| `npm run desktop:package:windows` | macOS, Win, Linux | Packages Windows NSIS Setup .exe installer |
| `npm run desktop:package:linux` | Linux Only | Packages universal AppImage for host architecture |
| `npm run desktop:package:all` | Any | Packages all desktop targets supported by host |
| `npm run mobile:build-engine:android` | macOS, Win, Linux | Compiles dev native Rust engine for Android |
| `npm run mobile:build-engine:android:release` | macOS, Win, Linux | Compiles release engine for all Android ABIs |
| `npm run mobile:start` | macOS, Win, Linux | Starts Expo Metro bundler server |
| `npm run mobile:android` | macOS, Win, Linux | Launches app on Android device / emulator |
| `npm run mobile:build:apk-release` | macOS, Win, Linux | Builds 3 production APKs (arm64, armv7, universal) |
| `npm run mobile:build:bundle` | macOS, Win, Linux | Builds Google Play release .aab |
| `npm run package:artifacts` | macOS, Win, Linux | Gathers all release binaries into `releases/` |
| `npm run generate:icons` | macOS, Win, Linux | Compiles brand SVGs into all platform icons |
| `npm run prune` | macOS, Win, Linux | Prunes throwaway caches (reclaims 5–15 GB) |
| `npm run clean` | macOS, Win, Linux | Standard full workspace cache clean |
| `npm run check:all` | macOS, Win, Linux | Runs TypeScript checks & 12 Rust engine tests |

---

## 🔧 Troubleshooting Guide

### 1. Android NDK "16 KB page-size alignment"
Android 15+ devices require native ELF binaries to be aligned to 16 KB boundaries. DocChisel's `scripts/build-mobile-engine.mjs` automatically passes `-C link-arg=-Wl,-z,max-page-size=16384` to `cargo-ndk`. Ensure you compile with:
```bash
npm run mobile:build-engine:android:release
```

### 2. Missing `cargo-ndk`
If Android engine compilation reports missing `cargo-ndk`:
```bash
cargo install cargo-ndk
```

### 3. Missing Android targets in Rust
If Android compilation fails due to missing standard libraries:
```bash
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
```

### 4. Linux Desktop: WebKit2GTK not found
If `pkg-config` cannot locate `webkit2gtk-4.1`:
```bash
# Ubuntu / Debian
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev pkg-config

# Fedora
sudo dnf install -y webkit2gtk4.1-devel gtk3-devel pkg-config

# Arch Linux
sudo pacman -S --needed webkit2gtk-4.1 gtk3 pkgconf

# openSUSE
sudo zypper install -y webkit2gtk4-devel gtk3-devel pkg-config
```

### 5. Linux Desktop: AppImage FUSE Error
Modern Linux distributions (Ubuntu 22.04+, Debian 12, Fedora, Arch, openSUSE) may not include FUSE v2 runtime by default:
```bash
# Ubuntu / Debian
sudo apt install -y libfuse2

# Fedora
sudo dnf install -y fuse-libs

# Arch Linux
sudo pacman -S fuse2

# openSUSE
sudo zypper install -y libfuse2

# Or run the AppImage without FUSE via self-extraction:
APPIMAGE_EXTRACT_AND_RUN=1 ./DocChisel_*.AppImage
```

---

## 📄 License

DocChisel is open-source software licensed under the **Apache-2.0 License**. See [LICENSE](LICENSE) for full details.
