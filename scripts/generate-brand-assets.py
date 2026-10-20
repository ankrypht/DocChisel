import os
import sys
import shutil
import subprocess
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BRAND_DIR = os.path.join(ROOT, 'assets/brand')
DESKTOP_ICONS_DIR = os.path.join(ROOT, 'apps/desktop/src-tauri/icons')
MOBILE_ASSETS_DIR = os.path.join(ROOT, 'apps/mobile/assets')
ANDROID_RES_DIR = os.path.join(ROOT, 'apps/mobile/android/app/src/main/res')

BRAND_BLUE = (11, 132, 254)       # #0B84FE
BRAND_BLUE_HEX = '#0B84FE'

def check_files():
    required = ['adaptive-foreground.png', 'adaptive-monochrome.png', 'splash-icon.png', 'desktop-app-icon.png']
    for f in required:
        path = os.path.join(BRAND_DIR, f)
        if not os.path.exists(path):
            print(f'Error: Missing {path}', file=sys.stderr)
            sys.exit(1)

def run():
    print('🎨 DocChisel Asset Generator')
    print('=============================')
    
    # Rasterize any brand SVGs first using Skia/@napi-rs/canvas if available
    render_script = os.path.join(ROOT, 'scripts/render-svg-brand.mjs')
    if os.path.exists(render_script):
        subprocess.run(['node', render_script], cwd=ROOT, check=True)
    
    check_files()

    adaptive_fg = Image.open(os.path.join(BRAND_DIR, 'adaptive-foreground.png'))
    adaptive_mono = Image.open(os.path.join(BRAND_DIR, 'adaptive-monochrome.png'))
    splash_ic = Image.open(os.path.join(BRAND_DIR, 'splash-icon.png'))
    
    # 1. Desktop master icon
    # If a custom desktop-app-icon.png exists in brand, use it; otherwise compose from splash-icon glyph
    desktop_brand_path = os.path.join(BRAND_DIR, 'desktop-app-icon.png')
    if os.path.exists(desktop_brand_path):
        desktop_master = Image.open(desktop_brand_path)
    else:
        # Extract glyph from splash-icon (highest res available) and scale to ~61.5% canvas
        bbox = splash_ic.getchannel('A').getbbox()
        glyph = splash_ic.crop(bbox)
        target_w = 630
        target_h = int(target_w / (glyph.size[0] / glyph.size[1]))
        resized_glyph = glyph.resize((target_w, target_h), Image.Resampling.LANCZOS)
        desktop_master = Image.new('RGBA', (1024, 1024), (*BRAND_BLUE, 255))
        x = (1024 - target_w) // 2
        y = (1024 - target_h) // 2
        desktop_master.paste(resized_glyph, (x, y), resized_glyph)

    # 2. Update Desktop Tauri icons
    print('1. Generating Desktop Icons (macOS .icns, Windows .ico, Linux PNGs)...')
    os.makedirs(DESKTOP_ICONS_DIR, exist_ok=True)
    desktop_icon_png = os.path.join(DESKTOP_ICONS_DIR, 'icon.png')
    desktop_master.save(desktop_icon_png, format='PNG')

    # Locate Tauri CLI (hoisted in monorepo root or in desktop workspace)
    tauri_candidates = [
        os.path.join(ROOT, 'node_modules/.bin/tauri.cmd' if sys.platform == 'win32' else 'node_modules/.bin/tauri'),
        os.path.join(ROOT, 'node_modules/.bin/tauri'),
        os.path.join(ROOT, 'apps/desktop/node_modules/.bin/tauri.cmd' if sys.platform == 'win32' else 'apps/desktop/node_modules/.bin/tauri'),
        os.path.join(ROOT, 'apps/desktop/node_modules/.bin/tauri'),
    ]
    tauri_bin = None
    for cand in tauri_candidates:
        if os.path.exists(cand):
            tauri_bin = cand
            break

    if not tauri_bin:
        tauri_bin = shutil.which('tauri')

    if tauri_bin:
        cmd = [tauri_bin, 'icon', desktop_icon_png, '-o', DESKTOP_ICONS_DIR]
    else:
        npx_bin = 'npx.cmd' if sys.platform == 'win32' else 'npx'
        cmd = [npx_bin, 'tauri', 'icon', desktop_icon_png, '-o', DESKTOP_ICONS_DIR]

    subprocess.run(cmd, cwd=os.path.join(ROOT, 'apps/desktop'), check=True)
    # Clean temporary directories produced by tauri icon
    for extra in ['android', 'ios']:
        extra_dir = os.path.join(DESKTOP_ICONS_DIR, extra)
        if os.path.exists(extra_dir):
            shutil.rmtree(extra_dir, ignore_errors=True)

    # 3. Update Mobile assets
    print('2. Generating Expo Mobile Assets (iOS 24-bit RGB, Android Adaptive, Splash)...')
    os.makedirs(MOBILE_ASSETS_DIR, exist_ok=True)
    
    # iOS icon (24-bit RGB without alpha channel for Apple App Store compliance)
    desktop_master.convert('RGB').save(os.path.join(MOBILE_ASSETS_DIR, 'icon.png'), format='PNG')
    # Adaptive icons
    adaptive_fg.save(os.path.join(MOBILE_ASSETS_DIR, 'adaptive-icon.png'), format='PNG')
    adaptive_mono.save(os.path.join(MOBILE_ASSETS_DIR, 'adaptive-monochrome.png'), format='PNG')
    # Splash icons
    splash_ic.save(os.path.join(MOBILE_ASSETS_DIR, 'splash-icon.png'), format='PNG')
    splash_bg = Image.new('RGB', (1024, 1024), BRAND_BLUE)
    splash_bg.paste(splash_ic, (0, 0), splash_ic)
    splash_bg.save(os.path.join(MOBILE_ASSETS_DIR, 'splash.png'), format='PNG')
    # Notification icon
    notif = adaptive_mono.resize((96, 96), Image.Resampling.LANCZOS)
    notif.save(os.path.join(MOBILE_ASSETS_DIR, 'notification-icon.png'), format='PNG')

    # 4. Android native mipmap and drawable buckets
    print('3. Generating Android Native Mipmaps & Drawables...')
    densities = {
        'mipmap-mdpi': (48, 108),
        'mipmap-hdpi': (72, 162),
        'mipmap-xhdpi': (96, 216),
        'mipmap-xxhdpi': (144, 324),
        'mipmap-xxxhdpi': (192, 432),
    }

    for folder, (legacy_sz, fg_sz) in densities.items():
        dir_path = os.path.join(ANDROID_RES_DIR, folder)
        os.makedirs(dir_path, exist_ok=True)
        # Foreground
        adaptive_fg.resize((fg_sz, fg_sz), Image.Resampling.LANCZOS).save(
            os.path.join(dir_path, 'ic_launcher_foreground.webp'), format='WEBP'
        )
        # Monochrome
        adaptive_mono.resize((fg_sz, fg_sz), Image.Resampling.LANCZOS).save(
            os.path.join(dir_path, 'ic_launcher_monochrome.webp'), format='WEBP'
        )
        # Legacy square launcher
        desktop_master.resize((legacy_sz, legacy_sz), Image.Resampling.LANCZOS).save(
            os.path.join(dir_path, 'ic_launcher.webp'), format='WEBP'
        )
        # Round launcher
        mask_scale = 4
        mask = Image.new('L', (legacy_sz * mask_scale, legacy_sz * mask_scale), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, legacy_sz * mask_scale - 1, legacy_sz * mask_scale - 1), fill=255)
        mask = mask.resize((legacy_sz, legacy_sz), Image.Resampling.LANCZOS)
        round_icon = Image.new('RGBA', (legacy_sz, legacy_sz), (0, 0, 0, 0))
        round_icon.paste(desktop_master.resize((legacy_sz, legacy_sz), Image.Resampling.LANCZOS), (0, 0), mask)
        round_icon.save(os.path.join(dir_path, 'ic_launcher_round.webp'), format='WEBP')

    # Splash drawables
    splash_densities = {
        'drawable-mdpi': 288,
        'drawable-hdpi': 432,
        'drawable-xhdpi': 576,
        'drawable-xxhdpi': 864,
        'drawable-xxxhdpi': 1152,
    }
    for folder, sz in splash_densities.items():
        dir_path = os.path.join(ANDROID_RES_DIR, folder)
        os.makedirs(dir_path, exist_ok=True)
        splash_ic.resize((sz, sz), Image.Resampling.LANCZOS).save(
            os.path.join(dir_path, 'splashscreen_logo.png'), format='PNG'
        )

    print('✨ All assets across macOS, Windows, Linux, iOS, and Android successfully generated!')

if __name__ == '__main__':
    run()
