import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BRAND_DIR = path.join(ROOT, 'assets/brand');

export async function renderBrandSvgs() {
  console.log('Rendering vector SVGs to high-res PNGs...');
  
  // 1. Transparent vector assets
  const transparentFiles = [
    { svg: 'adaptive-foreground.svg', png: 'adaptive-foreground.png' },
    { svg: 'adaptive-monochrome.svg', png: 'adaptive-monochrome.png' },
    { svg: 'splash-icon.svg', png: 'splash-icon.png' }
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
    console.log(`  ✓ Rendered ${item.svg} -> ${item.png} (100% transparent background)`);
  }
  
  // 2. Full background icons
  const bgFiles = [
    { svg: 'desktop-app-icon.svg', png: 'desktop-app-icon.png' }
  ];
  
  for (const item of bgFiles) {
    const svgPath = path.join(BRAND_DIR, item.svg);
    if (!fs.existsSync(svgPath)) continue;
    
    const svgData = fs.readFileSync(svgPath);
    const img = await loadImage(svgData);
    const canvas = createCanvas(1024, 1024);
    const ctx = canvas.getContext('2d');
    
    // Fill full-bleed brand blue first to guarantee 0 transparent edge pixels
    ctx.fillStyle = '#0B84FE';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);
    
    fs.writeFileSync(path.join(BRAND_DIR, item.png), canvas.toBuffer('image/png'));
    console.log(`  ✓ Rendered ${item.svg} -> ${item.png} (100% full-bleed opaque)`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  renderBrandSvgs().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
