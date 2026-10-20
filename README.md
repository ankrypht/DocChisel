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
- **📱 Mobile App**: Built with Expo + React Native + NativeWind with a native UniFFI Rust bridge for iOS and Android.
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
> **Complete Build, Test & Packaging Guide**: See [INSTRUCTIONS.md](INSTRUCTIONS.md) for step-by-step setup, hot-reload dev servers, building Android APK & Google Play `.aab`, macOS DMG, Windows MSI/EXE, and exporting all release binaries to the unified `releases/` directory.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Rust](https://rustup.rs/) (v1.75+)
- For Desktop builds: [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/) (Windows C++ Build Tools on Windows, Xcode CLI on macOS)
- For Mobile builds: Android Studio / Xcode, and [cargo-ndk](https://github.com/bbqsrc/cargo-ndk) (for Android NDK compilation)

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
npm run desktop:dev
```

### Running the Mobile App

```bash
# Build the native Rust engine for mobile (Android/iOS)
npm run mobile:build-engine

# Start the Expo development server
npm run mobile:start

# Or launch directly on Android / iOS
npm run mobile:android
npm run mobile:ios
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
