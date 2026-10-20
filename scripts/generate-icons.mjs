import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const BRAND_DIR = path.join(REPO_ROOT, 'assets/brand');
const DESKTOP_ICONS_DIR = path.join(REPO_ROOT, 'apps/desktop/src-tauri/icons');
const MOBILE_ASSETS_DIR = path.join(REPO_ROOT, 'apps/mobile/assets');
const ANDROID_RES_DIR = path.join(REPO_ROOT, 'apps/mobile/android/app/src/main/res');

const BRAND_BLUE = '#0B84FE';

console.log('==================================================');
console.log('🎨 [DocChisel] Pure Node.js Brand Asset Generator');
console.log('==================================================');

async function renderSvgs() {
  console.log('1. Rendering vector SVGs to high-DPI bitmaps (Skia)...');

  // Transparent vector assets
  const transparentFiles = [
    { svg: 'adaptive-foreground.svg', png: 'adaptive-foreground.png' },
    { svg: 'adaptive-monochrome.svg', png: 'adaptive-monochrome.png' },
    { svg: 'splash-icon.svg', png: 'splash-icon.png' },
  ];

  for (const item of transparentFiles) {
    const svgPath = path.join(BRAND_DIR, item.svg);
    if (!fs.existsSync(svgPath)) continue;

    const svgData = fs.readFileSync(svgPath);
    const img = await loadImage(svgData);
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);

    fs.writeFileSync(path.join(BRAND_DIR, item.png), canvas.toBuffer('image/png'));
    console.log(`  ✓ Rendered ${item.svg} -> ${item.png} (transparent)`);
  }

  // Full-bleed opaque icon
  const bgFiles = [{ svg: 'desktop-app-icon.svg', png: 'desktop-app-icon.png' }];
  for (const item of bgFiles) {
    const svgPath = path.join(BRAND_DIR, item.svg);
    if (!fs.existsSync(svgPath)) continue;

    const svgData = fs.readFileSync(svgPath);
    const img = await loadImage(svgData);
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = BRAND_BLUE;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);

    fs.writeFileSync(path.join(BRAND_DIR, item.png), canvas.toBuffer('image/png'));
    console.log(`  ✓ Rendered ${item.svg} -> ${item.png} (full-bleed opaque)`);
  }
}

async function run() {
  await renderSvgs();

  // Load master images
  const desktopMasterImg = await loadImage(fs.readFileSync(path.join(BRAND_DIR, 'desktop-app-icon.png')));
  const adaptiveFgImg = await loadImage(fs.readFileSync(path.join(BRAND_DIR, 'adaptive-foreground.png')));
  const adaptiveMonoImg = await loadImage(fs.readFileSync(path.join(BRAND_DIR, 'adaptive-monochrome.png')));
  const splashImg = await loadImage(fs.readFileSync(path.join(BRAND_DIR, 'splash-icon.png')));

  // ----------------------------------------------------
  // 1. Desktop Tauri Icons (.icns, .ico, PNGs)
  // ----------------------------------------------------
  console.log('\n2. Generating Desktop Icons via Tauri CLI (.icns, .ico, PNGs)...');
  fs.mkdirSync(DESKTOP_ICONS_DIR, { recursive: true });
  const desktopIconPng = path.join(DESKTOP_ICONS_DIR, 'icon.png');

  // Save 1024x1024 master icon.png
  const desktopCanvas = createCanvas(1024, 1024);
  const dCtx = desktopCanvas.getContext('2d');
  dCtx.drawImage(desktopMasterImg, 0, 0, 1024, 1024);
  fs.writeFileSync(desktopIconPng, desktopCanvas.toBuffer('image/png'));

  // Run tauri icon command
  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';
  const tauriRes = spawnSync(npxCmd, ['tauri', 'icon', desktopIconPng, '-o', DESKTOP_ICONS_DIR], {
    cwd: path.join(REPO_ROOT, 'apps/desktop'),
    stdio: 'inherit',
    shell: isWin,
  });

  if (tauriRes.status !== 0) {
    console.warn('  ⚠️ Tauri CLI icon generation returned non-zero; continuing with mobile assets...');
  }

  // Remove redundant extra directories produced by tauri icon
  for (const extra of ['android', 'ios']) {
    const extraDir = path.join(DESKTOP_ICONS_DIR, extra);
    if (fs.existsSync(extraDir)) {
      try {
        fs.rmSync(extraDir, { recursive: true, force: true });
      } catch {}
    }
  }

  // ----------------------------------------------------
  // 2. Mobile Expo Assets (iOS 24-bit RGB, Splash, Adaptive)
  // ----------------------------------------------------
  console.log('\n3. Generating Expo Mobile Assets (iOS 24-bit RGB, Splash, Adaptive)...');
  fs.mkdirSync(MOBILE_ASSETS_DIR, { recursive: true });

  // iOS App Store Icon (Strictly opaque 24-bit RGB, 0% alpha)
  const iosCanvas = createCanvas(1024, 1024);
  const iosCtx = iosCanvas.getContext('2d');
  iosCtx.fillStyle = BRAND_BLUE;
  iosCtx.fillRect(0, 0, 1024, 1024);
  iosCtx.drawImage(desktopMasterImg, 0, 0, 1024, 1024);
  fs.writeFileSync(path.join(MOBILE_ASSETS_DIR, 'icon.png'), iosCanvas.toBuffer('image/png'));

  // Adaptive icons
  fs.copyFileSync(path.join(BRAND_DIR, 'adaptive-foreground.png'), path.join(MOBILE_ASSETS_DIR, 'adaptive-icon.png'));
  fs.copyFileSync(path.join(BRAND_DIR, 'adaptive-monochrome.png'), path.join(MOBILE_ASSETS_DIR, 'adaptive-monochrome.png'));
  fs.copyFileSync(path.join(BRAND_DIR, 'splash-icon.png'), path.join(MOBILE_ASSETS_DIR, 'splash-icon.png'));

  // Full Splash background with logo
  const splashCanvas = createCanvas(1024, 1024);
  const sCtx = splashCanvas.getContext('2d');
  sCtx.fillStyle = BRAND_BLUE;
  sCtx.fillRect(0, 0, 1024, 1024);
  sCtx.drawImage(splashImg, 0, 0, 1024, 1024);
  fs.writeFileSync(path.join(MOBILE_ASSETS_DIR, 'splash.png'), splashCanvas.toBuffer('image/png'));

  // Notification Icon (96x96)
  const notifCanvas = createCanvas(96, 96);
  const nCtx = notifCanvas.getContext('2d');
  nCtx.drawImage(adaptiveMonoImg, 0, 0, 96, 96);
  fs.writeFileSync(path.join(MOBILE_ASSETS_DIR, 'notification-icon.png'), notifCanvas.toBuffer('image/png'));

  // ----------------------------------------------------
  // 3. Android Native Mipmaps & Drawables
  // ----------------------------------------------------
  console.log('4. Generating Android Native Mipmaps & Drawables...');
  const densities = {
    'mipmap-mdpi': { legacy: 48, fg: 108 },
    'mipmap-hdpi': { legacy: 72, fg: 162 },
    'mipmap-xhdpi': { legacy: 96, fg: 216 },
    'mipmap-xxhdpi': { legacy: 144, fg: 324 },
    'mipmap-xxxhdpi': { legacy: 192, fg: 432 },
  };

  for (const [folder, dims] of Object.entries(densities)) {
    const dirPath = path.join(ANDROID_RES_DIR, folder);
    fs.mkdirSync(dirPath, { recursive: true });

    // 1. Foreground WebP
    const fgCanvas = createCanvas(dims.fg, dims.fg);
    fgCanvas.getContext('2d').drawImage(adaptiveFgImg, 0, 0, dims.fg, dims.fg);
    fs.writeFileSync(path.join(dirPath, 'ic_launcher_foreground.webp'), fgCanvas.toBuffer('image/webp'));

    // 2. Monochrome WebP
    const monoCanvas = createCanvas(dims.fg, dims.fg);
    monoCanvas.getContext('2d').drawImage(adaptiveMonoImg, 0, 0, dims.fg, dims.fg);
    fs.writeFileSync(path.join(dirPath, 'ic_launcher_monochrome.webp'), monoCanvas.toBuffer('image/webp'));

    // 3. Legacy Square WebP
    const sqCanvas = createCanvas(dims.legacy, dims.legacy);
    sqCanvas.getContext('2d').drawImage(desktopMasterImg, 0, 0, dims.legacy, dims.legacy);
    fs.writeFileSync(path.join(dirPath, 'ic_launcher.webp'), sqCanvas.toBuffer('image/webp'));

    // 4. Round WebP (with circular mask)
    const roundCanvas = createCanvas(dims.legacy, dims.legacy);
    const rCtx = roundCanvas.getContext('2d');
    rCtx.beginPath();
    rCtx.arc(dims.legacy / 2, dims.legacy / 2, dims.legacy / 2, 0, Math.PI * 2);
    rCtx.closePath();
    rCtx.clip();
    rCtx.drawImage(desktopMasterImg, 0, 0, dims.legacy, dims.legacy);
    fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.webp'), roundCanvas.toBuffer('image/webp'));
  }

  // Splash Drawables
  const splashDensities = {
    'drawable-mdpi': 288,
    'drawable-hdpi': 432,
    'drawable-xhdpi': 576,
    'drawable-xxhdpi': 864,
    'drawable-xxxhdpi': 1152,
  };

  for (const [folder, sz] of Object.entries(splashDensities)) {
    const dirPath = path.join(ANDROID_RES_DIR, folder);
    fs.mkdirSync(dirPath, { recursive: true });
    const c = createCanvas(sz, sz);
    c.getContext('2d').drawImage(splashImg, 0, 0, sz, sz);
    fs.writeFileSync(path.join(dirPath, 'splashscreen_logo.png'), c.toBuffer('image/png'));
  }

  console.log('\n✨ All brand assets across macOS, Windows, Linux, iOS, and Android generated successfully in pure Node.js!');
  console.log('==================================================');
}

run().catch((err) => {
  console.error('\n❌ Error generating brand assets:', err);
  process.exit(1);
});
