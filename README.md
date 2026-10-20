# DocChisel

<div align="center">
  <h3>100% Local, Offline, All-in-One PDF & Image Toolkit</h3>
  <p>Run high-performance document and image manipulation locally on Desktop and Mobile with zero servers, zero cloud uploads, and zero telemetry.</p>
</div>

---

## ⚡ Highlights

- **🔒 100% Local & Offline**: Your files never leave your device. Zero cloud uploads, zero remote dependencies, zero tracking.
- **🦀 High-Performance Rust Core Engine**: Multi-threaded with Rayon, SIMD image resampling with Lanczos3, and memory-mapped streaming.
- **🖥️ Cross-Platform Desktop App**: Built with Tauri v2 + React 19 + Tailwind CSS for macOS, Windows, and Linux.
- **📱 Mobile App**: Built with Expo + React Native + NativeWind with a native UniFFI Rust bridge for Android (and architected for iOS; iOS is currently untested and not released pending App Store fees).
- **🎨 Sleek Dark Aesthetic**: Modern dark interface inspired by Apple & Zinc design principles.
- **📄 Permissive Open-Source**: Licensed under Apache 2.0.

---

## 🛠️ Tool Catalog

| Tool | Category | Description |
| :--- | :--- | :--- |
| **Merge PDF** | PDF | Combine multiple PDFs in any custom order with high-speed local processing. |
| **Split PDF** | PDF | Burst documents into single pages or extract arbitrary page ranges. |
| **Organize PDF** | PDF | Visual page organizer: rotate (90°, 180°, 270°), reorder, or delete individual pages. |
| **Images to PDF** | PDF | Convert JPG, PNG, and WebP collections into standard A4, Letter, or Fit PDFs. |
| **Image Studio** | Image | Batch compress, resize using SIMD (Lanczos3), and convert between PNG, JPEG, and WebP. |

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
└── scripts/              # Build, mobile engine, brand icon generation, and cleanup utilities
```

---

## 🚀 Getting Started

> [!TIP]
> **Complete Build, Test & Packaging Guide**: See [INSTRUCTIONS.md](INSTRUCTIONS.md) for step-by-step setup, hot-reload dev servers, building Android APKs & Google Play `.aab`, macOS Universal DMG, Windows NSIS Setup `.exe`, Linux DEB & AppImage, and exporting all release binaries to the unified `releases/` directory.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Rust](https://rustup.rs/) (v1.75+)
- For Desktop builds: [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)
  - **Linux (Ubuntu/Debian)**:
    ```bash
    sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config
    ```
  - **Linux (Fedora)**:
    ```bash
    sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel libxdo-devel && sudo dnf group install "c-development"
    ```
  - **Linux (Arch Linux)**:
    ```bash
    sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module libappindicator-gtk3 librsvg xdotool
    ```
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: Visual Studio 2022 C++ Build Tools (Desktop development with C++) and WebView2
- For Mobile builds: Android Studio, Android SDK / NDK, and [cargo-ndk](https://github.com/bbqsrc/cargo-ndk) (for Android NDK compilation). Xcode is optional and only required if building for iOS in the future.

> [!NOTE]
> All build, mobile engine generation, cleanup, and artifact packaging scripts in `scripts/` are written in native Node.js (`.mjs`) and execute seamlessly across Windows (PowerShell / CMD), macOS, and Linux without requiring WSL or Git Bash.

### Installation

```bash
# Clone the repository
git clone https://github.com/ankrypht/DocChisel.git
cd DocChisel

# Install dependencies across all workspaces
npm install
```

### Running the Desktop App

```bash
# Start Tauri desktop app with hot-reload (macOS, Windows, or Linux)
npm run desktop:dev

# Or run frontend-only preview in browser
npm run desktop:dev:web
```

### Packaging Apps for Production

1. **Build for your target platform**:
   ```bash
   # macOS: Build Universal DMG (Apple Silicon + Intel)
   npm run desktop:package:mac-universal
   # or for host-architecture testing: npm run desktop:package:mac

   # Windows: Build NSIS Setup (.exe) installer
   npm run desktop:package:windows

   # Linux: Build Debian (.deb) package and standalone AppImage
   npm run desktop:package:linux

   # Android: Build 3 release APKs (arm64, armv7, universal) & Google Play .aab
   npm run mobile:build:apk-release
   npm run mobile:build:bundle
   ```

2. **Collect all binaries into the unified `releases/` folder**:
   ```bash
   npm run package:artifacts
   ```

### Running the Mobile App

> [!NOTE]
> **iOS Status (Untested / Deferred)**: DocChisel mobile is actively developed, tested, and targeted for **Android**. The mobile codebase and UniFFI Swift bridge architecture retain full iOS readiness for future releases, but iOS builds are currently **untested** and unreleased pending Apple Developer App Store account registration. All default mobile scripts build exclusively for Android to prevent unnecessary compilation cycles and disk space consumption.

```bash
# Build the native Rust engine for Android development (arm64-v8a fast dev)
npm run mobile:build-engine:android

# Start the Expo development server
npm run mobile:start

# Launch directly on Android emulator or connected device
npm run mobile:android

# (Optional / Untested) To compile the native engine and launch on iOS in the future:
# npm run mobile:build-engine:ios
# npm run mobile:ios

# Or build for all mobile platforms:
# npm run mobile:build-engine:all
```

### Running Tests

```bash
# Run Rust core engine tests
npm test

# Run TypeScript checks across all workspaces
npm run typecheck
```

### 🎨 Brand Assets & Icon Generation

DocChisel maintains an SVG-first brand asset pipeline. Master vectors live in `assets/brand/*.svg`. To compile all cross-platform OS icons (macOS Retina `.icns`, Windows `.ico` and Square tiles, iOS 24-bit RGB PNGs, Android adaptive WebP density buckets, and splash screens):

```bash
npm run generate:icons
```

---

## 🧹 Maintenance & Cleanup

To purge intermediate build outputs, kill lingering background Gradle Java daemons, and manage disk space:

```bash
# Instant safe prune: removes disposable intermediate scratchpads (.cxx, Android intermediates,
# Cargo incremental caches) without deleting built APKs, DMGs, or release binaries
npm run prune
# or: npm run clean:intermediates

# Standard clean: terminates Gradle daemons, cleans Cargo target, Android, iOS & Expo caches
npm run clean

# Deep clean: also purges the releases/ directory
npm run clean:deep
```


---

## 📄 License

Distributed under the Apache 2.0 License. See [LICENSE](LICENSE) for more information.
