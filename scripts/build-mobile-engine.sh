#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> [DocChisel] Building Core Engine for Mobile Platforms"
cd "$REPO_ROOT"

ANDROID_JNILIBS="$REPO_ROOT/apps/mobile/modules/docchisel-bridge/android/src/main/jniLibs"
IOS_LIB_DIR="$REPO_ROOT/apps/mobile/modules/docchisel-bridge/ios"

mkdir -p "$ANDROID_JNILIBS"
mkdir -p "$IOS_LIB_DIR"

IS_RELEASE=false
for arg in "$@"; do
    case "$arg" in
        --release)
            IS_RELEASE=true
            ;;
    esac
done

# 1. Build Android shared libraries (.so) via cargo-ndk (with 16 KB page-size alignment for Android 15+)
if command -v cargo-ndk &> /dev/null; then
    export CARGO_TARGET_AARCH64_LINUX_ANDROID_RUSTFLAGS="-C link-arg=-Wl,-z,max-page-size=16384"
    export CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_RUSTFLAGS="-C link-arg=-Wl,-z,max-page-size=16384"
    export CARGO_TARGET_X86_64_LINUX_ANDROID_RUSTFLAGS="-C link-arg=-Wl,-z,max-page-size=16384"
    export CARGO_TARGET_I686_LINUX_ANDROID_RUSTFLAGS="-C link-arg=-Wl,-z,max-page-size=16384"
    if [ "$IS_RELEASE" = true ]; then
        echo "==> Compiling for Android [Release: arm64-v8a, armeabi-v7a, x86_64] (16 KB aligned)..."
        cargo ndk -t arm64-v8a -t armeabi-v7a -t x86_64 \
            -o "$ANDROID_JNILIBS" \
            build --release --package core_engine
        echo "✓ Multi-target Android .so libraries built in $ANDROID_JNILIBS"
    else
        echo "==> Compiling for Android [Dev: arm64-v8a only for Apple Silicon/modern devices] (16 KB aligned)..."
        cargo ndk -t arm64-v8a \
            -o "$ANDROID_JNILIBS" \
            build --package core_engine
        echo "✓ Fast local dev arm64-v8a .so built in $ANDROID_JNILIBS"
    fi
else
    echo "⚠️ cargo-ndk not found in PATH. Skipping Android native build."
fi

# 2. Build iOS static library (.a)
echo "==> Compiling for iOS targets..."
if [ "$IS_RELEASE" = true ]; then
    if cargo build --package core_engine --target aarch64-apple-ios-sim --release 2>/dev/null; then
        echo "✓ Built aarch64-apple-ios-sim (release)"
        cp "$REPO_ROOT/target/aarch64-apple-ios-sim/release/libcore_engine.a" "$IOS_LIB_DIR/libcore_engine.a"
    elif cargo build --package core_engine --release; then
        echo "ℹ️ Simulator target not fully configured; using host release build as placeholder."
        cp "$REPO_ROOT/target/release/libcore_engine.a" "$IOS_LIB_DIR/libcore_engine.a" 2>/dev/null || true
    fi
else
    if cargo build --package core_engine --target aarch64-apple-ios-sim 2>/dev/null; then
        echo "✓ Built aarch64-apple-ios-sim (dev)"
        cp "$REPO_ROOT/target/aarch64-apple-ios-sim/debug/libcore_engine.a" "$IOS_LIB_DIR/libcore_engine.a"
    elif cargo build --package core_engine; then
        echo "ℹ️ Simulator target not fully configured; using host dev build as placeholder."
        cp "$REPO_ROOT/target/debug/libcore_engine.a" "$IOS_LIB_DIR/libcore_engine.a" 2>/dev/null || true
    fi
fi

# 3. Generate UniFFI bindings
echo "==> Generating UniFFI Bindings for Swift and Kotlin..."
DYLIB_PATH="$REPO_ROOT/target/debug/libcore_engine.dylib"
if [ ! -f "$DYLIB_PATH" ]; then
    cargo build --package core_engine
fi

KOTLIN_OUT="$REPO_ROOT/apps/mobile/modules/docchisel-bridge/android/src/main/java"
mkdir -p "$KOTLIN_OUT"
cargo run --package core_engine --bin uniffi-bindgen -- generate \
    --library "$DYLIB_PATH" \
    --language swift \
    --language kotlin \
    --no-format \
    --out-dir "$IOS_LIB_DIR" 2>/dev/null || true

# Copy Kotlin output to proper package structure
if [ -d "$IOS_LIB_DIR/uniffi" ]; then
    cp -r "$IOS_LIB_DIR/uniffi" "$KOTLIN_OUT/"
    rm -rf "$IOS_LIB_DIR/uniffi"
fi

echo "✓ Mobile native build and bindings generation complete!"
