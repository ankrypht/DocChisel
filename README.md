# DocChisel

<div align="center">
  <h3>100% Local, Offline, All-in-One PDF & Image Toolkit</h3>
  <p>Run high-performance document and image manipulation locally on Desktop and Mobile with zero servers, zero cloud uploads, and zero telemetry.</p>
</div>

---

## ⚡ Highlights

- **🔒 100% Local & Offline**: Your files never leave your device. Zero cloud uploads, zero remote dependencies, zero tracking.
- **🦀 High-Performance Rust Core Engine**: Multi-threaded with Rayon, SIMD image resampling with Lanczos3, and memory-mapped streaming on modern Rust 2024 edition.
- **🖥️ Cross-Platform Desktop App**: Built with Tauri v2 + React 19 + Tailwind CSS for macOS, Windows, and Linux.
- **📱 Mobile App**: Built with Expo + React Native + NativeWind with a native UniFFI Rust bridge for Android (and architected for iOS; iOS is currently untested and not released pending App Store fees).
- **🎨 Sleek Dark Aesthetic**: Modern dark interface inspired by Apple & Zinc design principles.
- **📄 Permissive Open-Source**: Licensed under Apache 2.0.

---

## 🛠️ Tool Catalog

| Tool | Category | Description |
| :--- | :--- | :--- |
| **Merge PDF** | Organize PDF | Combine multiple PDFs in any custom order with high-speed local processing. |
| **Split PDF** | Organize PDF | Burst documents into single pages or extract arbitrary page ranges. |
| **Organize PDF** | Organize PDF | Visual page organizer: rotate (90°, 180°, 270°), reorder, or delete individual pages. |
| **Compress PDF** | Organize PDF | Downsample high-DPI images and recompress streams locally with zero quality loss. |
| **Watermark PDF** | Organize PDF | Overlay configurable text or image watermark stamps with opacity, rotation, and positioning. |
| **Page Numbers** | Organize PDF | Stamp sequential page numbering with flexible format templates and margin controls. |
| **Protect PDF** | Organize PDF | Secure sensitive PDF files with password protection and strict AES-256 encryption. |
| **Unlock PDF** | Organize PDF | Decrypt password-protected PDFs to create permanent unencrypted copies. |
| **Crop PDF** | Organize PDF | Trim page margins by customizing MediaBox and CropBox coordinates with precision. |
| **Images to PDF** | Convert | Convert JPG, PNG, and WebP collections into standard A4, Letter, or Fit PDFs. |
| **Image Studio** | Image Studio | Batch compress, resize, and convert between PNG, JPEG, and WebP. |
| **Watermark Image** | Image Studio | Protect creative visual assets with custom translucent text or brand logo watermarks. |

---

## 🌐 Compatibility & Exclusivity Matrix (Native Host Builds Only)

DocChisel is engineered to run and build natively on developer machines without requiring virtual machines, Docker containers, or cloud CI pipelines:

| Target Platform | Final Package Format | macOS Host | Windows Host | Linux Host | Pipeline & Exclusivity Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Android** | 3 APKs + 1 AAB | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | **Native on all 3 hosts** via Android SDK, NDK, and `cargo-ndk`. |
| **Windows** | NSIS Setup `.exe` | ✅ **Yes** | ✅ **Yes** | ✅ **Yes** | **Native on Windows** (MSVC + NSIS); **Cross-compiled on macOS & Linux** via `cargo-xwin` + `makensis` + LLVM/LLD. |
| **macOS** | Universal `.dmg` | ✅ **Yes** | ❌ **No** | ❌ **No** | **macOS Exclusive**. Requires Apple Cocoa frameworks, codesigning, and `hdiutil` DMG creation. |
| **Linux** | `.deb` + `.AppImage` (64/32-bit AMD & ARM) | ❌ **No** | ❌ **No** | ✅ **Yes** | **Linux Exclusive**. Supports 64-bit AMD (`amd64`), 32-bit AMD (`i386`/`i686`), 64-bit ARM (`arm64`), and 32-bit ARM (`armhf`). |
| **iOS** | `.ipa` / Simulator | ✅ **Yes** | ❌ **No** | ❌ **No** | **macOS Exclusive**. Requires Xcode and iOS SDKs (untested/unreleased). |

> [!NOTE]
> All build, mobile engine generation, cleanup, and artifact packaging scripts in `scripts/` are written in native Node.js (`.mjs`) and execute seamlessly across Windows (PowerShell / CMD), macOS, and Linux without shell dependencies (`rm -rf`, `./gradlew`, `&&` chaining).

---

## 📁 Monorepo Structure

```
DocChisel/
├── apps/
│   ├── desktop/          # Tauri v2 + React 19 + Tailwind CSS desktop app
│   └── mobile/           # Expo React Native + NativeWind mobile app
├── assets/
│   └── brand/            # Master SVG brand vectors and source graphics
├── crates/
│   └── core_engine/      # Pure Rust engine compiled for desktop and mobile targets
├── packages/
│   └── shared/           # Shared TypeScript types, schemas, and tool catalog definitions
├── scripts/              # Build, mobile engine, brand icon generation, and cleanup utilities
└── releases/             # Unified collection folder for all finalized release binaries
```

---

## 🚀 Getting Started (From the Very First)

> [!TIP]
> **Complete In-Depth Guide**: See [INSTRUCTIONS.md](INSTRUCTIONS.md) for detailed per-OS dependency installation guides, environment variable setups, device debugging, and release packaging instructions.

### Step 1: Install Common Tools

1. **Node.js**: Install Node.js LTS `v24+` from [nodejs.org](https://nodejs.org/).
2. **Rust**: Install Rust via [rustup.rs](https://rustup.rs/).

```bash
# Verify installations in your terminal
node -v
npm -v
rustc --version
cargo --version
```

### Step 2: Clone & Verify Workspace

```bash
# Clone the repository
git clone https://github.com/ankrypht/DocChisel.git
cd DocChisel

# Install dependencies across all monorepo workspaces
npm install

# Run TypeScript checks and verify all Rust core engine integration tests
npm run check:all
```

---

## 🧰 Development Host Setup (Download by Host OS)

### 1. macOS Development Host
- **Xcode Command Line Tools**: `xcode-select --install`
- **For Android Development**: Install [Android Studio](https://developer.android.com/studio) with SDK Platforms (API 34/35), Android SDK Build-Tools, NDK (`v26.x`/`v27.x`), and install `cargo-ndk`:
  ```bash
  cargo install cargo-ndk
  rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
  ```
- **(Optional) For Windows Cross-Compilation on macOS**:
  ```bash
  brew install makensis llvm lld
  cargo install cargo-xwin
  rustup target add x86_64-pc-windows-msvc
  ```

### 2. Windows Development Host
- **C++ Build Tools**: Install [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and select the *"Desktop development with C++"* workload.
- **WebView2**: Included by default in Windows 10/11; otherwise install [Evergreen WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
- **NSIS 3.x**: Install via `winget install NSIS.NSIS` or download from [SourceForge](https://nsis.sourceforge.io/).
- **For Android Development**: Install [Android Studio](https://developer.android.com/studio) with SDK Platforms (API 34/35), NDK (`v26.x`/`v27.x`), and install `cargo-ndk`:
  ```bash
  cargo install cargo-ndk
  rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
  ```

### 3. Linux Development Host (Ubuntu/Debian, Fedora, Arch, openSUSE)
- **WebKit2GTK & Desktop Libraries**:
  - **Ubuntu / Debian**:
    ```bash
    sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libgtk-3-bin libglib2.0-bin build-essential curl wget file libssl-dev librsvg2-dev librsvg2-common pkg-config patchelf libfuse2
    ```
  - **Fedora**:
    ```bash
    sudo dnf install -y webkit2gtk4.1-devel gtk3-devel openssl-devel curl wget file librsvg2-devel pkg-config patchelf fuse-libs && sudo dnf group install -y "c-development"
    ```
  - **Arch Linux**:
    ```bash
    sudo pacman -S --needed webkit2gtk-4.1 gtk3 base-devel curl wget file openssl librsvg patchelf pkgconf fuse2
    ```
  - **openSUSE**:
    ```bash
    sudo zypper install -y webkit2gtk4-devel gtk3-devel libopenssl-devel curl wget file librsvg-devel pkg-config patchelf libfuse2 && sudo zypper install -t pattern devel_basis
    ```
- **Rust Linux Targets (64-bit and 32-bit AMD & ARM)**:
  ```bash
  rustup target add x86_64-unknown-linux-gnu i686-unknown-linux-gnu aarch64-unknown-linux-gnu armv7-unknown-linux-gnueabihf
  # (Optional: for local 32-bit multiarch cross-compilation on 64-bit Ubuntu/Debian):
  # - For 32-bit AMD/Intel (i686):
  #   sudo dpkg --add-architecture i386 && sudo apt install -y gcc-multilib g++-multilib libwebkit2gtk-4.1-dev:i386 libgtk-3-dev:i386 librsvg2-dev:i386 librsvg2-common:i386 libssl-dev:i386
  # - For 32-bit ARM (armhf):
  #   sudo dpkg --add-architecture armhf && sudo apt install -y gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf libwebkit2gtk-4.1-dev:armhf libgtk-3-dev:armhf librsvg2-dev:armhf librsvg2-common:armhf libssl-dev:armhf qemu-user-static binfmt-support
  ```
- **For Android Development**: Install [Android Studio for Linux](https://developer.android.com/studio), configure `ANDROID_HOME`, and install `cargo-ndk`:
  ```bash
  cargo install cargo-ndk
  rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
  ```
- **(Optional) For Windows Cross-Compilation on Linux**:
  ```bash
  sudo apt install -y nsis llvm lld
  cargo install cargo-xwin
  rustup target add x86_64-pc-windows-msvc
  ```

---

## ⚡ Running the Applications (Development)

### Desktop App (macOS, Windows, or Linux)
```bash
# Launch Tauri desktop application with hot-reload
npm run desktop:dev
```

### Android App (macOS, Windows, or Linux)

DocChisel uses `expo-dev-client` for development builds (inspired by [Moluxis](https://github.com/ankrypht/Moluxis)), installing alongside the production app as `DocChisel (Dev)` (`com.ankushsarkar.docchisel.dev`):

```bash
# Step 1: Build the native Rust engine for Android dev (fast arm64-v8a compilation)
npm run mobile:engine -- --android

# Step 2: Start Expo Metro bundler server
npm run mobile:start

# Step 3: Run directly on Android emulator or connected device
npm run mobile:android

# (Optional) Build standalone development APK directly for your physical device:
npm run mobile:package -- --android --dev
```

#### 📲 Running on a Physical Android Phone / Tablet:
1. Build the development APK: `npm run mobile:package -- --android --dev` (saved to `releases/android/DocChisel-<version>-dev.apk`).
2. Transfer to phone via USB (or install via `adb install -r releases/android/DocChisel-<version>-dev.apk`).
3. Start Metro on computer: `npm run mobile:start`.
4. Open **DocChisel (Dev)** on your phone and scan the QR code to connect and start developing!

### iOS App (macOS Exclusive)
```bash
# Local development on iOS Simulator:
npm run mobile:engine -- --ios
npm run mobile:ios

# Production packaging (.ipa via EAS CLI or Xcode):
npm run mobile:package -- --ios
```

---

## 📦 Packaging Apps for Production

Run the command corresponding to your target platform. All scripts validate host platform safeguards:

```bash
# Desktop: Compiles for specific target platform
npm run desktop:package -- --mac        # macOS Universal DMG (macOS host exclusive)
npm run desktop:package -- --windows    # Windows NSIS Setup .exe (MSVC on Win, cargo-xwin on Mac/Linux)
npm run desktop:package -- --linux      # Linux AppImage + DEB (defaults to host arch)

# Linux single-format or specific architecture options:
# npm run desktop:package -- --linux --deb            # .deb package only
# npm run desktop:package -- --linux --appimage       # .AppImage only
# npm run desktop:package -- --linux --arch x64        # 64-bit AMD/Intel target (x86_64)
# npm run desktop:package -- --linux --arch arm64      # 64-bit ARM target (aarch64)
# npm run desktop:package -- --linux --arch x86        # 32-bit AMD/Intel target (i686)
# npm run desktop:package -- --linux --arch armhf      # 32-bit ARM target (armv7)
# npm run desktop:package -- --linux --all-arch       # All 4 Linux architectures

# Download Linux packages built by GitHub Actions directly to releases/linux/:
npm run linux:download

# Android: Compiles multi-architecture engine and generates 3 release APKs (arm64, armv7, universal)
npm run mobile:package -- --android

# Android (Development APK for physical device):
npm run mobile:package -- --android --dev

# Android (Google Play Store): Compiles production .aab bundle
npm run mobile:package -- --android --bundle

# iOS: Package production release (.ipa) or configure Xcode archive
npm run mobile:package -- --ios
```

> [!NOTE]
> **Linux Multi-Architecture & Cloud Build (GitHub Actions)**:
> - **Formats Generated**: Every architecture produces both Debian `.deb` and universal `.AppImage` packages.
> - **Building from macOS / Windows**: Because Linux GUI apps link dynamically against WebKit2GTK 4.1 and GTK3, they cannot be compiled directly on Darwin or Windows hosts without Linux environments.
> - **GitHub Actions Workflow**: A complete workflow (`.github/workflows/build-linux.yml`) is provided that builds all 4 architectures (`x86_64`, `arm64`, `i686`, `armhf`) in the cloud and bundles all 8 `.deb` and `.AppImage` files into a single zip artifact (`docchisel-linux-all-v<version>.zip`).
> - **Download**: You can download the zip directly from the GitHub Actions run page, or run `npm run linux:download` to automatically fetch and place them into `releases/linux/`.

### 🎯 Collect All Final Binaries
```bash
# Automatically gathers all built binaries (.apk, .aab, .dmg, .exe, .deb, .AppImage, .ipa)
# into the clean unified releases/ folder at the repository root
npm run package:artifacts
```

---

## 🎨 Brand Assets & Icon Generation

DocChisel uses an **SVG-first architecture** with vector masters in `assets/brand/`. To re-render high-DPI bitmaps, macOS `.icns`, Windows `.ico`, iOS 24-bit PNGs, and Android adaptive mipmaps across all platforms:

```bash
npm run generate:icons
```

---

## 🧹 Maintenance & Cleanup

```bash
# Instant prune: deletes intermediate build scratchpads (.cxx, Android intermediates,
# Cargo incremental caches) without deleting built APKs, DMGs, or release binaries
npm run prune

# Full clean: terminates Gradle daemons, cleans Cargo target, Android, iOS & Expo caches
# Strictly preserves the releases/ directory so finalized binaries are never deleted
npm run clean
```

---

## 📄 License

Distributed under the **Apache 2.0 License**. See [LICENSE](LICENSE) for more information.
