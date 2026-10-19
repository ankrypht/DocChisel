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
├── crates/
│   └── core_engine/      # Pure Rust engine compiled for desktop and mobile targets
├── packages/
│   └── shared/           # Shared TypeScript types, schemas, and tool catalog definitions
└── scripts/              # Build, mobile engine generation, and cleanup utilities
```

---

## 🚀 Getting Started

> [!TIP]
> **Complete Build, Test & Packaging Guide**: See [INSTRUCTIONS.md](INSTRUCTIONS.md) for step-by-step setup, hot-reload dev servers, building Android APK & Google Play `.aab`, macOS DMG, Windows MSI/EXE, and exporting all release binaries to the unified `releases/` directory.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Rust](https://rustup.rs/) (v1.75+)
- For Desktop builds: [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)
- For Mobile builds: Android Studio / Xcode, and [cargo-ndk](https://github.com/bbqsrc/cargo-ndk) (for Android NDK compilation)

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

---

## 🧹 Maintenance & Cleanup

To purge intermediate build outputs, kill any lingering background Gradle Java daemons, and prune cached native transforms:

```bash
# Standard clean: terminates Gradle daemons, cleans Cargo, Android & Expo caches
npm run clean

# Deep clean: also purges releases/ and runs npm dedupe
npm run clean:deep
```

---

## 📄 License

Distributed under the Apache 2.0 License. See [LICENSE](LICENSE) for more information.
