#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# DocChisel - Central Artifact Collector
# Consolidates all final compiled binaries (Android APK/AAB, macOS DMG/App,
# Windows MSI/EXE, and iOS IPA) into a unified root directory: <repo_root>/releases
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEST_DIR="${1:-$REPO_ROOT/releases}"

echo "=================================================="
echo "📦 [DocChisel] Collecting Release Artifacts"
echo "   Destination: $DEST_DIR"
echo "=================================================="

mkdir -p "$DEST_DIR/android"
mkdir -p "$DEST_DIR/macos"
mkdir -p "$DEST_DIR/windows"
mkdir -p "$DEST_DIR/ios"

COUNT=0

# Helper to format and display file details
record_file() {
    local src="$1"
    local dest="$2"
    cp -f "$src" "$dest"
    local filename
    filename="$(basename "$src")"
    local size
    size="$(ls -lh "$src" | awk '{print $5}')"
    echo "  ✓ [$(basename "$dest")] $filename ($size)"
    COUNT=$((COUNT + 1))
}

# 1. Android APKs (.apk)
echo "==> Checking for Android APKs..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        record_file "$file" "$DEST_DIR/android/"
    fi
done < <(find "$REPO_ROOT/apps/mobile/android/app/build/outputs/apk" -type f -name "*.apk" 2>/dev/null || true)

# 2. Android App Bundles (.aab)
echo "==> Checking for Android App Bundles (.aab)..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        record_file "$file" "$DEST_DIR/android/"
    fi
done < <(find "$REPO_ROOT/apps/mobile/android/app/build/outputs/bundle" -type f -name "*.aab" 2>/dev/null || true)

# 3. macOS Desktop (.dmg and .app bundle)
echo "==> Checking for macOS bundles..."
SEARCH_PATHS=("$REPO_ROOT/target" "$REPO_ROOT/apps/desktop/src-tauri/target")
for search_dir in "${SEARCH_PATHS[@]}"; do
    if [ -d "$search_dir" ]; then
        # DMG installers
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                record_file "$file" "$DEST_DIR/macos/"
            fi
        done < <(find "$search_dir" -type f -name "*.dmg" 2>/dev/null || true)

        # macOS .app directory bundles
        while IFS= read -r dir; do
            if [ -d "$dir" ] && [[ "$dir" == *"/bundle/macos/"* ]]; then
                app_name="$(basename "$dir")"
                rm -rf "$DEST_DIR/macos/$app_name"
                cp -R "$dir" "$DEST_DIR/macos/"
                echo "  ✓ [macos] $app_name (App Bundle Directory)"
                COUNT=$((COUNT + 1))
            fi
        done < <(find "$search_dir" -maxdepth 6 -type d -name "*.app" 2>/dev/null || true)
    fi
done

# 4. Windows Desktop (.msi and .exe installers)
echo "==> Checking for Windows installers..."
for search_dir in "${SEARCH_PATHS[@]}"; do
    if [ -d "$search_dir" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                record_file "$file" "$DEST_DIR/windows/"
            fi
        done < <(find "$search_dir" -type f \( -name "*.msi" -o -name "*setup*.exe" -o -name "*Setup*.exe" \) 2>/dev/null || true)
    fi
done

# 5. iOS (.ipa)
echo "==> Checking for iOS builds..."
while IFS= read -r file; do
    if [ -f "$file" ]; then
        record_file "$file" "$DEST_DIR/ios/"
    fi
done < <(find "$REPO_ROOT/apps/mobile/ios/build" "$REPO_ROOT/apps/mobile" -maxdepth 5 -type f -name "*.ipa" 2>/dev/null || true)

echo ""
if [ "$COUNT" -gt 0 ]; then
    echo "=================================================="
    echo "🎉 Successfully gathered $COUNT artifact(s) into:"
    echo "   $DEST_DIR"
    echo "=================================================="
    echo ""
    echo "--- Released Files ---"
    find "$DEST_DIR" -type f -exec ls -lh {} + 2>/dev/null | awk '{print "  •", $9, "(" $5 ")"}'
    echo "----------------------"
else
    echo "ℹ️ No newly built artifacts found yet to collect."
    echo ""
    echo "To build artifacts:"
    echo "  • Android APK:      npm run mobile:build:apk-release"
    echo "  • Android AAB:      npm run mobile:build:bundle"
    echo "  • macOS Desktop:    npm run desktop:package:mac"
    echo "  • Windows Desktop:  npm run desktop:package:windows"
    echo "  • iOS App:          npm run mobile:ios:release"
    echo "  • Or one-step:      npm run package:android / npm run package:mac"
    echo "=================================================="
fi
