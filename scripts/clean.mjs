import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const isDeep = process.argv.includes('--deep');

console.log('==================================================');
console.log(`🧹 [DocChisel] Cleaning Build Artifacts & Caches ${isDeep ? '(Deep Mode)' : ''}`);
console.log('==================================================');

function removeSafe(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  } catch {}
}

// 1. Rust Cargo Clean
console.log('==> Cleaning Rust build caches...');
try {
  execSync('cargo clean', { cwd: REPO_ROOT, stdio: 'ignore' });
} catch {
  removeSafe(path.join(REPO_ROOT, 'target'));
  removeSafe(path.join(REPO_ROOT, 'apps/desktop/src-tauri/target'));
}

// 2. Android Build Artifacts & Caches
console.log('==> Cleaning Android build artifacts & intermediate caches...');
const androidCleanPaths = [
  path.join(REPO_ROOT, 'apps/mobile/android/app/build'),
  path.join(REPO_ROOT, 'apps/mobile/android/build'),
  path.join(REPO_ROOT, 'apps/mobile/modules/docchisel-bridge/android/build'),
  path.join(REPO_ROOT, 'apps/mobile/android/app/.cxx'),
  path.join(REPO_ROOT, 'apps/mobile/android/.gradle'),
  path.join(REPO_ROOT, 'apps/mobile/android/.kotlin'),
];
for (const p of androidCleanPaths) {
  removeSafe(p);
}

// 3. Vite & Expo Bundler Caches
console.log('==> Cleaning Vite & Expo bundler caches...');
const bundlerPaths = [
  path.join(REPO_ROOT, 'apps/mobile/.expo'),
  path.join(REPO_ROOT, 'apps/desktop/dist'),
  path.join(REPO_ROOT, 'apps/desktop/node_modules/.vite'),
  path.join(REPO_ROOT, 'apps/desktop/node_modules/.vite-temp'),
  path.join(REPO_ROOT, '.expo'),
];
for (const p of bundlerPaths) {
  removeSafe(p);
}

// 4. Deep mode: Clean releases
if (isDeep) {
  console.log('==> Deep Mode: Removing releases directory...');
  removeSafe(path.join(REPO_ROOT, 'releases'));
}

console.log('\n✅ Cleanup Complete!\n==================================================');
