# DocChisel — Build, Test & Packaging Guide

This document provides a comprehensive, step-by-step guide for anyone cloning the **DocChisel** repository from GitHub. It covers:

- System prerequisites for every target platform
- Initial workspace installation and verification
- Testing and hot-reload development servers (Desktop, Android, and iOS)
- Building production binaries for all operating systems (**Android APK & `.aab`**, **macOS DMG & `.app`**, **Windows `.msi` & `.exe`**, and **iOS**)
- Automatic collection of all final release binaries into a unified root directory: `releases/`

---

## 📑 Table of Contents

1. [Monorepo Architecture Overview](#-monorepo-architecture-overview)
2. [Prerequisites by Platform](#-prerequisites-by-platform)
   - [Common Tooling](#1-common-tooling-all-platforms)
   - [macOS & iOS Tooling](#2-macos--ios-tooling-apple-silicon--intel)
   - [Windows Desktop Tooling](#3-windows-desktop-tooling)
   - [Android Tooling](#4-android-tooling-apk--aab-on-macos-windows-or-linux)
3. [Initial Repository Setup](#-initial-repository-setup)
4. [Testing & Hot-Reload Development](#-testing--hot-reload-development)
   - [Desktop App (macOS & Windows)](#1-desktop-app-development-with-hot-reload)
   - [Android App (Emulator or Device)](#2-android-app-development-with-hot-reload)
   - [iOS App (Simulator or Device)](#3-ios-app-development-with-hot-reload)
   - [Rust Core Engine Tests](#4-rust-core-engine-tests)
   - [TypeScript Type Checking](#5-typescript-type-checking)
5. [Production Build & Packaging](#-production-build--packaging)
   - [Android: Release APK and Google Play .aab](#1-android-production-builds-apk--aab)
   - [macOS Desktop: DMG and .app](#2-macos-desktop-builds-dmg--app)
   - [Windows Desktop: MSI and Setup .exe](#3-windows-desktop-builds-msi--exe)
   - [iOS Mobile: Release Bundle](#4-ios-mobile-builds)
6. [Unified Artifact Collection (`releases/`)](#-unified-artifact-collection-releases)
7. [Convenience Scripts Cheat Sheet](#-convenience-scripts-cheat-sheet)
8. [Troubleshooting & Maintenance](#-troubleshooting--maintenance)

---

## 🏛️ Monorepo Architecture Overview

DocChisel is organized into workspaces managed by npm and Cargo:

```
DocChisel/
├── apps/
│   ├── desktop/          # Tauri v2 + React 19 + Tailwind CSS (macOS, Windows, Linux)
│   └── mobile/           # Expo React Native + NativeWind (Android & iOS)
├── crates/
│   └── core_engine/      # Pure Rust engine compiled for desktop and mobile FFI
├── packages/
│   └── shared/           # Shared TypeScript types, schemas, and tool catalog definitions
├── scripts/
│   ├── build-mobile-engine.sh # Compiles Rust core_engine to .so / .a and generates UniFFI bindings
│   ├── collect-artifacts.sh   # Gathers all compiled binaries into the root /releases directory
│   └── clean.sh               # Deep cleaner for build caches and temp files
└── releases/             # Unified destination for all production binaries (.apk, .aab, .dmg, .exe)
```

---

## 🧰 Prerequisites by Platform

### 1. Common Tooling (All Platforms)

- **Node.js**: `v20.x` or `v22.x` LTS ([Download Node.js](https://nodejs.org/))
- **npm**: `v10+` (bundled with Node.js)
- **Rust**: `v1.75+` ([Install rustup](https://rustup.rs/))
  ```bash
  # Verify installation
  node -v
  npm -v
  rustc --version
  cargo --version
  ```

---

### 2. macOS & iOS Tooling (Apple Silicon & Intel)

Required for building macOS desktop apps and iOS mobile apps:

1. **Xcode**: Install Xcode 15+ from the Mac App Store or Apple Developer portal.
2. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **CocoaPods**:
   ```bash
   brew install cocoapods
   # or: sudo gem install cocoapods
   ```
4. **Rust Target Toolchains**:

   ```bash
   # macOS targets
   rustup target add aarch64-apple-darwin
   rustup target add x86_64-apple-darwin

   # iOS targets
   rustup target add aarch64-apple-ios
   rustup target add aarch64-apple-ios-sim
   rustup target add x86_64-apple-ios
   ```

---

### 3. Windows Desktop Tooling

Required for building Windows `.msi` and `.exe` installers:

1. **Visual Studio 2022 / Build Tools**:
   - Install **Visual Studio C++ Build Tools** (Select the _"Desktop development with C++"_ workload).
2. **WebView2**:
   - Included by default on Windows 10/11; otherwise install the [Evergreen WebView2 Bootstrapper](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
3. **WiX Toolset (for MSI generation)**:
   - Tauri v2 uses WiX or NSIS to bundle Windows installers. Install WiX v3.11 or v4 if building `.msi`.
4. **Rust Windows Target**:
   ```bash
   rustup default stable-x86_64-pc-windows-msvc
   ```

---

### 4. Android Tooling (APK & .AAB on macOS, Windows, or Linux)

Required for building Android debug/release APKs and Google Play `.aab` bundles:

1. **JDK 17**:
   - Install OpenJDK 17 or Eclipse Temurin 17 ([Adoptium](https://adoptium.net/)).
   - Set `JAVA_HOME` pointing to JDK 17.
2. **Android Studio**:
   - Install [Android Studio](https://developer.android.com/studio).
   - In **SDK Manager**:
     - SDK Platforms: **Android 14 (API 34)** or **Android 15 (API 35)**.
     - SDK Tools:
       - Android SDK Build-Tools (34.0.0 or 35.0.0)
       - Android SDK Command-line Tools (latest)
       - Android SDK Platform-Tools
       - **NDK (Side by side)**: `26.x` or `27.x`
       - CMake (`3.22.1` or newer)
3. **Configure Environment Variables**:
   Add to `~/.bashrc`, `~/.zshrc`, or Windows System Environment Variables:
   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk"   # macOS (or %LOCALAPPDATA%\Android\Sdk on Windows)
   export PATH="$PATH:$ANDROID_HOME/emulator"
   export PATH="$PATH:$ANDROID_HOME/platform-tools"
   export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
   ```
4. **`cargo-ndk` (Compiles Rust for Android)**:
   ```bash
   cargo install cargo-ndk
   ```
5. **Rust Android Targets**:
   ```bash
   rustup target add aarch64-linux-android
   rustup target add armv7-linux-androideabi
   rustup target add x86_64-linux-android
   rustup target add i686-linux-android
   ```

---

## 🚀 Initial Repository Setup

Clone the repository and install all npm dependencies across all workspaces:

```bash
# 1. Clone the repository
git clone https://github.com/ankrypht/DocChisel.git
cd DocChisel

# 2. Install workspace dependencies
npm install

# 3. Verify core engine and typecheck
npm run check:all
```

`npm run check:all` runs TypeScript validation across all workspaces and executes the full Rust test suite in `crates/core_engine`.

---

## ⚡ Testing & Hot-Reload Development

### 1. Desktop App Development (with Hot Reload)

The desktop app combines a React 19 + Tailwind CSS frontend with a Tauri v2 native wrapper.

```bash
npm run desktop:dev
```

- **Hot Module Replacement (HMR)**: Any edits made to `apps/desktop/src/` (components, pages, styles) update instantly in the running desktop window.
- **Rust Auto-Recompile**: Any edits made to `apps/desktop/src-tauri/` or `crates/core_engine/` will automatically trigger a Cargo rebuild and reload the desktop app.
- _(Optional)_ Web-only preview without launching Tauri:
  ```bash
  cd apps/desktop
  npm run dev
  # Open http://localhost:1420 in your browser
  ```

---

### 2. Android App Development (with Hot Reload)

Developing for Android requires the native Rust engine to be compiled for the mobile bridge:

```bash
# Step 1: Build the mobile Rust engine for development (arm64-v8a fast compilation)
npm run mobile:build-engine

# Step 2: Boot an Android emulator (or connect a physical device via USB debugging)
# Step 3: Run the app on Android
npm run mobile:android
```

- **Expo Fast Refresh**: Edits to `apps/mobile/app/` or `components/` update the UI on the emulator instantly.
- **Developer Menu & Reload**:
  - Press `r` in the terminal to reload the JavaScript bundle.
  - Press `m` in the terminal (or shake the device / press `Cmd+M` on macOS / `Ctrl+M` on Windows) to open the Expo Dev Menu.
- To run the standalone Metro bundler:
  ```bash
  npm run mobile:start
  ```

---

### 3. iOS App Development (with Hot Reload)

_(Requires macOS and Xcode)_

```bash
# Step 1: Build the mobile Rust engine for iOS targets
npm run mobile:build-engine

# Step 2: Launch on iOS Simulator
npm run mobile:ios
```

- **Fast Refresh**: React Native Fast Refresh reloads components without losing component state.
- **Developer Menu & Reload**:
  - Press `r` in the terminal or `Cmd+R` in the iOS Simulator to reload.
  - Press `Cmd+D` in the iOS Simulator to open the in-app developer menu.

---

### 4. Rust Core Engine Tests

DocChisel follows a test-driven architecture. All PDF and image manipulation tools have integration tests:

```bash
# Run all core engine tests
npm test

# Or run cargo directly
cargo test --package core_engine
```

---

### 5. TypeScript Type Checking

Validate type safety across `@docchisel/shared`, `@docchisel/desktop`, and `@docchisel/mobile`:

```bash
npm run typecheck
```

---

## 📦 Production Build & Packaging

All production builds can be run directly from the workspace root. After building, outputs can be automatically consolidated into `<repo_root>/releases` (see [Unified Artifact Collection](#-unified-artifact-collection-releases)).

---

### 1. Android Production Builds (APK & .AAB)

#### Step A: Compile the Multi-Architecture Release Engine

Builds 16 KB page-size aligned `.so` libraries for `arm64-v8a`, `armeabi-v7a`, and `x86_64`:

```bash
npm run mobile:build-engine:release
```

#### Step B1: Build Android Release APK (`.apk`)

Generates an installable `.apk` file:

```bash
npm run mobile:build:apk-release
```

- **Output location**: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- _(Optional)_ To build a debug APK for quick sideloading:
  ```bash
  npm run mobile:build:apk-debug
  # Output: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
  ```

#### Step B2: Build Android App Bundle (`.aab` for Google Play Store)

Generates the optimized `.aab` distribution package for Google Play Console:

```bash
npm run mobile:build:bundle
```

- **Output location**: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

> **Note on Production Signing**: The release build automatically checks for production upload credentials via environment variables:
>
> ```bash
> export DOCCHISEL_UPLOAD_STORE_FILE="/path/to/my-upload-key.keystore"
> export DOCCHISEL_UPLOAD_STORE_PASSWORD="my-store-password"
> export DOCCHISEL_UPLOAD_KEY_ALIAS="my-key-alias"
> export DOCCHISEL_UPLOAD_KEY_PASSWORD="my-key-password"
> ```
>
> If these variables are not provided, Gradle falls back seamlessly to `debug.keystore` for frictionless local developer testing and CI evaluation.
>
> **ABI Splits & Universal APKs**:
> Production builds generate per-architecture APKs (`app-arm64-v8a-release.apk`, `app-armeabi-v7a-release.apk`, `app-x86_64-release.apk`) alongside a universal APK (`app-universal-release.apk`) to guarantee the smallest possible download size for end users. The `.aab` bundle contains all architectures and 16 KB page-size aligned ELF binaries for Google Play Store distribution.

---

### 2. macOS Desktop Builds (DMG & .app)

_(Run on macOS)_

#### Build for Current Host Architecture:

```bash
npm run desktop:package:mac
```

- **Output location**:
  - DMG Installer: `target/release/bundle/dmg/DocChisel_0.1.0_aarch64.dmg` (or `x86_64`)
  - App Bundle: `target/release/bundle/macos/DocChisel.app`

#### Build Universal macOS Binary (Apple Silicon + Intel):

```bash
npm run desktop:package:mac-universal
```

- **Output location**: `target/universal-apple-darwin/release/bundle/dmg/*.dmg`s

---

### 3. Windows Desktop Builds (MSI & .exe)

_(Run on Windows with Visual Studio C++ Build Tools installed)_

```bash
npm run desktop:package:windows
```

- **Output location**:
  - Windows MSI Installer: `target/release/bundle/msi/DocChisel_0.1.0_x64_en-US.msi`
  - NSIS Setup Executable: `target/release/bundle/nsis/DocChisel_0.1.0_x64-setup.exe`

---

### 4. iOS Mobile Builds

_(Run on macOS with Xcode)_

```bash
# Step 1: Compile iOS native engine in release mode
npm run mobile:build-engine:release

# Step 2: Build iOS release
npm run mobile:ios:release
```

Alternatively, open `apps/mobile/ios/docchisel.xcworkspace` in Xcode to archive and export a signed `.ipa` using your Apple Developer Team provisioning profile:

```bash
open apps/mobile/ios/docchisel.xcworkspace
# In Xcode menu: Product -> Archive -> Distribute App
```

---

## 🎯 Unified Artifact Collection (`releases/`)

To prevent developers from having to dig through nested build trees (`apps/mobile/android/app/build/...`, `target/release/bundle/...`), DocChisel includes a central collector script:

```bash
npm run package:artifacts
# or: bash scripts/collect-artifacts.sh
```

### What this does:

1. Automatically scans all build directories for newly produced binaries.
2. Copies and organizes them into a single clean folder in your workspace root:
   ```
   releases/
   ├── android/
   │   ├── app-release.apk
   │   ├── app-release.aab
   │   └── app-debug.apk
   ├── macos/
   │   ├── DocChisel_0.1.0_aarch64.dmg
   │   └── DocChisel.app
   ├── windows/
   │   ├── DocChisel_0.1.0_x64-setup.exe
   │   └── DocChisel_0.1.0_x64_en-US.msi
   └── ios/
       └── DocChisel.ipa
   ```
3. Prints a clean file manifest showing the filename and byte size of every collected artifact.
4. The `releases/` directory is automatically ignored by Git to prevent accidentally committing large binary blobs.

---

## ⚡ Convenience Scripts Cheat Sheet

The following root npm scripts allow you to build **and** automatically collect your binaries in a single command:

| Command                         | Action                                               | Output in `releases/`              |
| :------------------------------ | :--------------------------------------------------- | :--------------------------------- |
| `npm run package:android`       | Builds release engine + APK + `.aab` + collects      | `releases/android/*.apk` & `*.aab` |
| `npm run package:android:apk`   | Builds release engine + Release APK + collects       | `releases/android/*.apk`           |
| `npm run package:android:aab`   | Builds release engine + Release `.aab` + collects    | `releases/android/*.aab`           |
| `npm run package:mac`           | Builds macOS DMG & App bundle + collects             | `releases/macos/*.dmg` & `.app`    |
| `npm run package:mac-universal` | Builds Universal macOS bundle + collects             | `releases/macos/*.dmg` & `.app`    |
| `npm run package:windows`       | Builds Windows MSI & EXE installer + collects        | `releases/windows/*.msi` & `*.exe` |
| `npm run package:ios`           | Builds release engine + iOS release + collects       | `releases/ios/*.ipa`               |
| `npm run package:artifacts`     | Gathers any existing built binaries into `releases/` | `releases/<platform>/`             |

---

## 🔧 Troubleshooting & Maintenance

### 1. Android NDK "16 KB page-size alignment" warnings

Android 15+ devices require native ELF binaries to be aligned to 16 KB boundaries.
DocChisel's `scripts/build-mobile-engine.sh` automatically passes `-C link-arg=-Wl,-z,max-page-size=16384` to `cargo-ndk`. Ensure you run:

```bash
npm run mobile:build-engine:release
```

### 2. Missing `cargo-ndk`

If you encounter `cargo-ndk: command not found`:

```bash
cargo install cargo-ndk
```

### 3. Missing Android targets in Rust

If Android compilation fails due to missing standard libraries:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
```

### 4. Cleaning build caches

If Gradle or Cargo get into an inconsistent state after updating dependencies, run the workspace cleanup script:

```bash
# Standard clean: terminates hanging Gradle Java daemons, clears Cargo target,
# Android Gradle build outputs, Expo/Vite caches, and pruned ~/.gradle transforms
npm run clean

# Deep clean: also purges node_modules and deep caches
npm run clean:deep
```

`npm run clean` automatically runs `./gradlew --stop` to kill background `GradleDaemon` and `KotlinCompileDaemon` processes holding onto RAM, and prunes bloated `~/.gradle/caches/transforms-*` and daemon logs to reclaim gigabytes of disk space.

---

## 📄 License

DocChisel is licensed under the **Apache-2.0** License.
See [LICENSE](LICENSE) for full legal text.
