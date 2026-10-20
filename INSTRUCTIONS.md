# DocChisel — Build, Test & Packaging Guide

This document provides a comprehensive, step-by-step guide for anyone cloning the **DocChisel** repository from GitHub. It covers:

- System prerequisites for every target platform
- Initial workspace installation and verification
- Testing and hot-reload development servers (Desktop, Android, and future iOS)
- Building production binaries for supported operating systems (**Android APK & `.aab`**, **macOS DMG & `.app`**, **Windows `.msi` & `.exe`**, **Linux `.deb` & `.AppImage`**, and optional **iOS**)
- Automatic collection of all final release binaries into a unified root directory: `releases/`

---

## 📑 Table of Contents

1. [Monorepo Architecture Overview](#-monorepo-architecture-overview)
2. [Prerequisites by Platform](#-prerequisites-by-platform)
   - [Common Tooling](#1-common-tooling-all-platforms)
   - [macOS & iOS Tooling](#2-macos--ios-tooling-apple-silicon--intel)
   - [Windows Desktop Tooling](#3-windows-desktop-tooling)
   - [Linux Desktop Tooling](#4-linux-desktop-tooling-ubuntudebian-fedora-arch-linux-opensuse)
   - [Android Tooling](#5-android-tooling-apk--aab-on-macos-windows-or-linux)
3. [Initial Repository Setup](#-initial-repository-setup)
4. [Testing & Hot-Reload Development](#-testing--hot-reload-development)
   - [Desktop App (macOS, Windows & Linux)](#1-desktop-app-development-with-hot-reload)
   - [Android App (Emulator or Device)](#2-android-app-development-with-hot-reload)
   - [iOS App (Optional / Untested)](#3-ios-app-development-optional--untested)
   - [Rust Core Engine Tests](#4-rust-core-engine-tests)
   - [TypeScript Type Checking](#5-typescript-type-checking)
5. [Production Build & Packaging](#-production-build--packaging)
   - [Android: Release APK and Google Play .aab](#1-android-production-builds-apk--aab)
   - [macOS Desktop: DMG and .app](#2-macos-desktop-builds-dmg--app)
   - [Windows Desktop: MSI and Setup .exe](#3-windows-desktop-builds-msi--exe)
   - [Linux Desktop: DEB, AppImage and RPM](#4-linux-desktop-builds-deb-appimage--rpm)
   - [iOS Mobile: Release Bundle (Optional / Untested)](#5-ios-mobile-builds-optional--untested)
6. [Brand Assets & Icon Generation Pipeline](#-brand-assets--icon-generation-pipeline)
7. [Unified Artifact Collection (`releases/`)](#-unified-artifact-collection-releases)
8. [Convenience Scripts Cheat Sheet](#-convenience-scripts-cheat-sheet)
9. [Troubleshooting & Maintenance](#-troubleshooting--maintenance)

---

## 🏛️ Monorepo Architecture Overview

DocChisel is organized into workspaces managed by npm and Cargo:

```
DocChisel/
├── apps/
│   ├── desktop/          # Tauri v2 + React 19 + Tailwind CSS (macOS, Windows, Linux)
│   └── mobile/           # Expo React Native + NativeWind (Android & iOS)
├── assets/
│   └── brand/            # Master SVG brand vectors and source graphics
├── crates/
│   └── core_engine/      # Pure Rust engine compiled for desktop and mobile FFI
├── packages/
│   └── shared/           # Shared TypeScript types, schemas, and tool catalog definitions
├── scripts/
│   ├── generate-brand-assets.py # Cross-platform icon compiler (macOS .icns, Win .ico, iOS, Android mipmaps)
│   ├── render-svg-brand.mjs   # Vector Skia renderer translating SVGs to high-DPI bitmaps
│   ├── build-mobile-engine.mjs# Cross-platform compiler for Rust core_engine to .so / .a and UniFFI bindings
│   ├── collect-artifacts.mjs  # Cross-platform collector gathering binaries into /releases
│   ├── prune-intermediates.mjs# Cross-platform disposable intermediate cache pruner
│   └── clean.mjs              # Cross-platform deep cleaner for build caches and temp files
└── releases/             # Unified destination for all production binaries (.apk, .aab, .dmg, .exe)
```

---

## 🧰 Prerequisites by Platform

### 1. Common Tooling (All Platforms)

- **Node.js**: `v24.x` LTS ([Download Node.js](https://nodejs.org/))
- **npm**: (bundled with Node.js)
- **Rust**: `v1.99+` ([Install rustup](https://rustup.rs/))
  ```bash
  # Verify installation
  node -v
  npm -v
  rustc --version
  cargo --version
  ```

---

### 2. macOS & iOS Tooling (Apple Silicon & Intel)

Required for building macOS desktop apps (and optionally iOS mobile apps):

1. **Xcode**: Install Xcode 15+ from the Mac App Store or Apple Developer portal (required for macOS desktop Tauri builds).
2. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **CocoaPods** _(Only needed if optionally building iOS in the future)_:
   ```bash
   brew install cocoapods
   # or: sudo gem install cocoapods
   ```
4. **Rust Target Toolchains**:

   ```bash
   # macOS targets (Active desktop build targets)
   rustup target add aarch64-apple-darwin
   rustup target add x86_64-apple-darwin

   # iOS targets (Optional; only install if building for iOS in the future)
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

### 4. Linux Desktop Tooling (Ubuntu/Debian, Fedora, Arch Linux, openSUSE)

Required for developing, compiling, and packaging Linux desktop applications (`.deb`, `.AppImage`, and `.rpm`):

1. **System & WebKitGTK Dependencies**:
   Install the required system C libraries, GTK3, WebKit2GTK 4.1, and `pkg-config` using your distribution's package manager:

   - **Debian / Ubuntu (22.04 LTS, 24.04 LTS+)**:
     ```bash
     sudo apt update
     sudo apt install -y libwebkit2gtk-4.1-dev \
       build-essential \
       curl \
       wget \
       file \
       libxdo-dev \
       libssl-dev \
       libayatana-appindicator3-dev \
       librsvg2-dev \
       pkg-config
     ```

   - **Fedora**:
     ```bash
     sudo dnf check-update
     sudo dnf install -y webkit2gtk4.1-devel \
       openssl-devel \
       curl \
       wget \
       file \
       libappindicator-gtk3-devel \
       librsvg2-devel \
       libxdo-devel \
       pkg-config
     sudo dnf group install -y "c-development"
     ```

   - **Arch Linux / Manjaro**:
     ```bash
     sudo pacman -Syu
     sudo pacman -S --needed \
       webkit2gtk-4.1 \
       base-devel \
       curl \
       wget \
       file \
       openssl \
       appmenu-gtk-module \
       libappindicator-gtk3 \
       librsvg \
       xdotool \
       pkgconf
     ```

   - **openSUSE**:
     ```bash
     sudo zypper refresh
     sudo zypper install -y webkit2gtk3-devel \
       openssl-devel \
       curl \
       wget \
       file \
       libayatana-appindicator3-1 \
       librsvg2-devel \
       libxdo-dev \
       pkg-config
     ```

2. **FUSE Runtime (Required for AppImages on Ubuntu 22.04+)**:
   ```bash
   sudo apt install -y libfuse2
   ```

3. **Rust Linux Target**:
   ```bash
   # Standard native Linux target
   rustup default stable
   ```

---

### 5. Android Tooling (APK & .AAB on macOS, Windows, or Linux)

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
# Step 1: Build the mobile Rust engine for Android dev (arm64-v8a fast compilation)
npm run mobile:build-engine:android

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

### 3. iOS App Development (Optional / Untested)

> [!NOTE]
> **Status: Untested & Unreleased**: The iOS build is currently **untested** and deferred pending Apple Developer App Store account registration. The complete mobile architecture, Swift UniFFI bridge, and Expo configuration remain fully intact in the repository for future activation. Default mobile commands compile exclusively for Android to prevent wasting disk space and build time on unused iOS assets.

_To build and launch on the iOS Simulator (requires macOS and Xcode):_

```bash
# Step 1: Build the mobile Rust engine explicitly for iOS targets
npm run mobile:build-engine:ios

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

#### Step A: Compile the Android Multi-Architecture Release Engine

Builds 16 KB page-size aligned `.so` libraries specifically for Android (`arm64-v8a`, `armeabi-v7a`, and `x86_64`) without redundantly building iOS:

```bash
npm run mobile:build-engine:android:release
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

### 4. Linux Desktop Builds (DEB, AppImage & RPM)

_(Run on Linux or in a Linux container/VM with Tauri dependencies installed)_

#### Build All Linux Packages (.deb + .AppImage):

```bash
npm run desktop:package:linux
```

- **Output locations**:
  - Debian Package: `target/release/bundle/deb/DocChisel_0.1.0_amd64.deb` (or `arm64`)
  - AppImage: `target/release/bundle/appimage/DocChisel_0.1.0_amd64.AppImage`

#### Build Specific Linux Package Formats:

```bash
# Build Debian (.deb) package only
npm run desktop:package:linux:deb

# Build standalone AppImage only
npm run desktop:package:linux:appimage

# Build Red Hat (.rpm) package (requires rpm-build or rpmbuild installed)
npm run desktop:package:linux:rpm
```

#### Running & Installing on Linux:

- **Standalone AppImage**:
  ```bash
  chmod +x target/release/bundle/appimage/DocChisel_*.AppImage
  ./target/release/bundle/appimage/DocChisel_*.AppImage
  ```
- **Debian / Ubuntu Package**:
  ```bash
  # Install directly with apt to resolve any system dependencies automatically:
  sudo apt install ./target/release/bundle/deb/DocChisel_*_amd64.deb
  # Or via dpkg:
  sudo dpkg -i target/release/bundle/deb/DocChisel_*_amd64.deb
  ```

---

### 5. iOS Mobile Builds (Optional / Untested)

> [!NOTE]
> **Status: Untested & Unreleased**: iOS release packaging is preserved as a future option, but is currently untested and deferred until an Apple Developer subscription is active.

_(Run on macOS with Xcode)_

```bash
# Step 1: Compile iOS native engine in release mode (without compiling Android ABIs)
npm run mobile:build-engine:ios:release

# Step 2: Build iOS release
npm run mobile:ios:release
```

Alternatively, open `apps/mobile/ios/docchisel.xcworkspace` in Xcode to archive and export a signed `.ipa` using your Apple Developer Team provisioning profile:

```bash
open apps/mobile/ios/docchisel.xcworkspace
# In Xcode menu: Product -> Archive -> Distribute App
```

---

## 🎨 Brand Assets & Icon Generation Pipeline

DocChisel uses an **SVG-first architecture** for all brand identity and application launch graphics. Master vectors are stored in `assets/brand/` as pure mathematical curves:

- `desktop-app-icon.svg`: Master square icon for macOS, Windows, Linux, and iOS (55% glyph coverage matching Apple HIG).
- `adaptive-foreground.svg`: Android adaptive launcher foreground with transparent background (safe for 66% circular masks).
- `adaptive-monochrome.svg`: Android 13+ Material You themed icon (flat white silhouette with transparency).
- `splash-icon.svg`: Mobile launch splash screen logo.

### Compiling Platform Assets

To automatically rasterize all SVGs and generate the full set of binary and bitmap targets across all operating systems:

```bash
npm run generate:icons
```

In ~2 seconds, this command automatically:
1. Rasterizes all SVGs to crisp high-DPI bitmaps using Skia (`@napi-rs/canvas`).
2. Generates desktop [icon.icns](apps/desktop/src-tauri/icons/icon.icns) (Retina macOS bundle) and [icon.ico](apps/desktop/src-tauri/icons/icon.ico) (Win32 multi-resolution container).
3. Generates all Windows Store modern tiles (`Square44x44`, `Square150x150`, `Square310x310`, `StoreLogo`).
4. Generates iOS 24-bit RGB icons (strictly 0% alpha for Apple App Store compliance).
5. Generates all Android density mipmaps (`ic_launcher.webp`, `ic_launcher_round.webp`, `ic_launcher_foreground.webp`, `ic_launcher_monochrome.webp`) and splash drawables across `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi`.

---

## 🎯 Unified Artifact Collection (`releases/`)

To prevent developers from having to dig through nested build trees (`apps/mobile/android/app/build/...`, `target/release/bundle/...`), DocChisel includes a central collector script:

```bash
npm run package:artifacts
# or: node scripts/collect-artifacts.mjs
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
   ├── linux/
   │   ├── DocChisel_0.1.0_amd64.deb
   │   └── DocChisel_0.1.0_amd64.AppImage
   └── ios/
       └── DocChisel.ipa
   ```
3. Prints a clean file manifest showing the filename and byte size of every collected artifact.
4. The `releases/` directory is automatically ignored by Git to prevent accidentally committing large binary blobs.

---

## ⚡ Convenience Scripts Cheat Sheet

The following root npm scripts provide dedicated, platform-specific commands to build, clean, and collect your binaries:

| Command                                 | Action                                               | Output / Purpose                   |
| :-------------------------------------- | :--------------------------------------------------- | :--------------------------------- |
| **Desktop Builds**                      |                                                      |                                    |
| `npm run desktop:package:mac`           | Builds macOS DMG & App bundle                        | `target/.../bundle/macos/`         |
| `npm run desktop:package:mac-universal` | Builds Universal macOS DMG & App bundle              | `target/.../bundle/macos/`         |
| `npm run desktop:package:windows`       | Builds Windows MSI & EXE installer                   | `target/.../bundle/msi/` & `nsis/` |
| `npm run desktop:package:linux`         | Builds Linux DEB & AppImage release packages         | `target/.../bundle/deb/` & `appimage/` |
| `npm run desktop:package:linux:debug`   | Builds Linux unstripped debug packages               | `target/.../bundle/deb/` & `appimage/` |
| `npm run desktop:package:linux:deb`     | Builds Linux Debian package (.deb)                   | `target/.../bundle/deb/`           |
| `npm run desktop:package:linux:appimage`| Builds Linux standalone AppImage                     | `target/.../bundle/appimage/`      |
| `npm run desktop:package:linux:rpm`     | Builds Linux Red Hat RPM package                     | `target/.../bundle/rpm/`           |
| `npm run desktop:package:all`           | Builds host desktop release bundles                  | Desktop release bundles            |
| `npm run desktop:test`                  | Runs Desktop Tauri backend unit test suite           | Rust test runner                   |
| **Mobile Builds**                       |                                                      |                                    |
| `npm run mobile:build:apk-debug`        | Compiles Android debug APK                           | `apps/mobile/.../apk/debug/`       |
| `npm run mobile:build:apk-release`      | Compiles multi-architecture Android release APK      | `apps/mobile/.../apk/release/`     |
| `npm run mobile:build:bundle`           | Compiles Android Google Play release `.aab`          | `apps/mobile/.../bundle/`          |
| `npm run mobile:ios:release`            | (Untested) Compiles iOS release configuration        | `apps/mobile/ios/build/`           |
| **Artifact Collection**                 |                                                      |                                    |
| `npm run package:artifacts`             | Gathers all built binaries into unified `releases/`  | `releases/<platform>/`             |
| **Mobile Native Engine Builds**         |                                                      |                                    |
| `npm run mobile:build-engine:android`   | Compiles dev mobile engine for Android (arm64-v8a)   | `docchisel-bridge/.../jniLibs`     |
| `npm run mobile:build-engine:android:release` | Compiles release engine for Android (all ABIs) | `docchisel-bridge/.../jniLibs`     |
| `npm run mobile:build-engine:ios`       | (Untested) Compiles dev engine for iOS simulator     | `docchisel-bridge/.../libcore_engine.a` |
| `npm run mobile:build-engine:ios:release` | (Untested) Compiles release engine for iOS targets | `docchisel-bridge/.../libcore_engine.a` |
| `npm run mobile:build-engine:all`       | Compiles dev engine for both Android and iOS         | Both mobile bridges                |
| `npm run mobile:build-engine:all:release` | Compiles release engine for both Android and iOS   | Both mobile bridges                |
| **Maintenance & Cleaning**              |                                                      |                                    |
| `npm run prune`                         | Safely purges intermediate scratchpads (.cxx, etc.)  | Reclaims 5–15 GB build cache       |
| `npm run clean:intermediates`           | Alias for `npm run prune`                            | Reclaims 5–15 GB build cache       |
| `npm run clean`                         | Full workspace reset: `cargo clean` and wipes caches | Clean workspace                    |
| `npm run clean:deep`                    | Deep reset: wipes caches plus `releases/` folder     | Pristine repository                |
| `npm run desktop:clean`                 | Cleans Desktop Vite and temporary dist caches        | Clean desktop workspace            |
| `npm run mobile:clean:android`          | Stops Gradle daemon and cleans Android build caches  | Clean Android workspace            |
| `npm run mobile:clean:ios`              | Cleans iOS build artifacts and CocoaPods             | Clean iOS workspace                |
| `npm run mobile:clean:all`              | Cleans both Android and iOS mobile build artifacts   | Clean mobile workspace             |
| `npm run generate:icons`                | Compiles brand SVGs into all platform icons & splash | `apps/*/icons/` & `res/mipmap-*/`  |


---

## 🔧 Troubleshooting & Maintenance

### 1. Android NDK "16 KB page-size alignment" warnings

Android 15+ devices require native ELF binaries to be aligned to 16 KB boundaries.
DocChisel's `scripts/build-mobile-engine.mjs` automatically passes `-C link-arg=-Wl,-z,max-page-size=16384` to `cargo-ndk`. Ensure you run:

```bash
npm run mobile:build-engine:android:release
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

### 4. Managing Disk Space & Preventing Build Bloat

Cross-platform builds (especially compiling multiple native Rust targets and React Native C++ modules across multiple ABIs) can generate gigabytes of intermediate scratchpads. DocChisel provides a 3-tier cleanup strategy:

1. **Instant Safe Prune (`npm run prune` or `npm run clean:intermediates`):**
   - **What it does:** Safely deletes disposable intermediate scratchpads without touching your release outputs:
     - Android `app/build/intermediates` (unstripped native libraries and temporary dex files)
     - CMake/Ninja build trees (`app/.cxx` and `node_modules/**/android/.cxx`)
     - Native C++ builds inside `node_modules/**/android/build`
     - Cargo incremental caches (`target/*/incremental`)
     - iOS DerivedData, CocoaPods, stray iOS static libraries, and temporary bundler caches
   - **When to use:** Anytime disk space feels tight or after running multiple builds. Reclaims **5–15 GB** instantly while keeping all built `.apk`, `.aab`, `.dmg`, `.exe`, and `.so` files intact.

2. **Standard Clean (`npm run clean`):**
   - **What it does:** Runs `cargo clean`, terminates any active background Gradle daemons (`./gradlew --stop`), removes Android/iOS build directories, and clears bundler caches.
   - **When to use:** When switching branches, updating core engine dependencies, or troubleshooting compiler errors.

3. **Deep Clean (`npm run clean:deep`):**
   - **What it does:** Performs a standard clean plus wipes the root `releases/` directory.

### 5. Linux Desktop Build & Runtime Issues

#### A. Missing WebKit2GTK or `pkg-config` during `cargo build`
If you encounter `pkg-config: "webkit2gtk-4.1" not found` or `failed to run custom build command for tauri`:
```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev pkg-config

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel pkg-config

# Arch Linux
sudo pacman -S --needed webkit2gtk-4.1 libappindicator-gtk3 pkgconf
```

#### B. AppImage fails to launch with FUSE error (`libfuse.so.2`)
Ubuntu 22.04+ and Debian 12 no longer include FUSE v2 by default:
```bash
sudo apt install -y libfuse2
# Or run without FUSE:
./DocChisel_0.1.0_amd64.AppImage --appimage-extract-and-run
```

#### C. WebKitGTK White Screen or Crash in Virtual Machines / WSLg
In virtualized Linux environments without OpenGL/GPU hardware acceleration, WebKitGTK's hardware compositing mode can cause blank windows. Disable compositing mode via environment variable:
```bash
export WEBKIT_DISABLE_COMPOSITING_MODE=1
npm run desktop:dev
```

### 6. Fast Local Mobile Development Tip

To avoid compiling all 4 target architectures during local mobile feature development:
```bash
# Compiles only arm64-v8a in dev mode (~1.5 GB in target/ instead of 9+ GB, skips iOS completely)
npm run mobile:build-engine:android
```
When ready for production packaging, compile your platform directly (e.g. `npm run mobile:build:apk-release`, `npm run desktop:package:linux`, or `npm run desktop:package:mac` / `npm run desktop:package:windows`), then run `npm run package:artifacts` to gather all binaries into `releases/`. Note that iOS is currently untested and not released pending App Store fees, though `npm run mobile:build-engine:ios` and `npm run mobile:ios:release` remain ready for future activation.


---

## 📄 License

DocChisel is licensed under the **Apache-2.0** License.
See [LICENSE](LICENSE) for full legal text.
