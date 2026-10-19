#!/usr/bin/env bash
set -euo pipefail

# DocChisel Monorepo Deep Cleanup Script
# Purges build artifacts, CMake NDK caches, Rust symbol caches, and ephemeral temporary files.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

DEEP_MODE=false
for arg in "$@"; do
    case "$arg" in
        --deep)
            DEEP_MODE=true
            ;;
    esac
done

echo "=================================================="
echo "🧹 [DocChisel] Cleaning Build Artifacts & Caches"
echo "=================================================="

# Function to get readable disk usage of key directories
report_sizes() {
    echo "--- Current Disk Usage ---"
    du -sh apps crates node_modules packages target 2>/dev/null || true
    echo "--------------------------"
}

echo "👉 Before Cleanup:"
report_sizes

# 1. Rust Targets
echo "==> Purging Rust target build caches..."
if command -v cargo &> /dev/null; then
    cargo clean
else
    rm -rf "$REPO_ROOT/target"
fi

# 2. Android App & Gradle Build Artifacts
echo "==> Purging Android build outputs and intermediate .cxx caches..."
rm -rf "$REPO_ROOT/apps/mobile/android/app/build" \
       "$REPO_ROOT/apps/mobile/android/build" \
       "$REPO_ROOT/apps/mobile/modules/docchisel-bridge/android/build" \
       "$REPO_ROOT/apps/mobile/android/app/.cxx" \
       "$REPO_ROOT/apps/mobile/android/.gradle" \
       "$REPO_ROOT/apps/mobile/android/.kotlin"

# Clean any TypeScript build caches
find "$REPO_ROOT" -name "*.tsbuildinfo" -delete 2>/dev/null || true

# 3. Clean transient CMake/NDK and Android build directories inside node_modules
echo "==> Purging Android build outputs and .cxx caches from node_modules..."
find "$REPO_ROOT/node_modules" -type d -path "*/android/build" -prune -exec rm -rf {} + 2>/dev/null || true
find "$REPO_ROOT/node_modules" -type d -name ".cxx" -prune -exec rm -rf {} + 2>/dev/null || true

# 4. Vite & Expo Local Caches
echo "==> Purging Expo and Vite bundler caches..."
rm -rf "$REPO_ROOT/apps/mobile/.expo" \
       "$REPO_ROOT/apps/desktop/dist" \
       "$REPO_ROOT/apps/desktop/node_modules/.vite" \
       "$REPO_ROOT/apps/desktop/node_modules/.vite-temp"

# 5. Remove any accidental root files created by CLI tools run from root
echo "==> Ensuring workspace root is free of accidental project artifacts..."
rm -rf "$REPO_ROOT/.expo" \
       "$REPO_ROOT/app.json" \
       "$REPO_ROOT/tsconfig.json" \
       "$REPO_ROOT/android"

# 6. Deep mode: deduplicate packages and prune npm caches & releases
if [ "$DEEP_MODE" = true ]; then
    echo "==> Deep mode enabled: Deduplicating node_modules and cleaning releases/..."
    rm -rf "$REPO_ROOT/releases"
    npm dedupe 2>/dev/null || true
fi

echo ""
echo "✅ Cleanup Complete!"
echo "👉 After Cleanup:"
report_sizes
echo "=================================================="
