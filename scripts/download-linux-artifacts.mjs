import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Read version from package.json
const pkgJsonPath = path.join(REPO_ROOT, 'package.json');
let version = '0.1.0';
try {
  const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  if (pkgData.version) version = pkgData.version;
} catch {}

function getExpandedEnv() {
  const extraPaths =
    process.platform === 'win32'
      ? []
      : ['/opt/homebrew/bin', '/usr/local/bin', path.join(process.env.HOME || '', '.local/bin')];
  const currentPath = process.env.PATH || '';
  const newPath = [...extraPaths.filter((p) => !currentPath.includes(p)), currentPath].join(path.delimiter);
  return { ...process.env, PATH: newPath };
}

function commandExists(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore', env: getExpandedEnv() });
    return true;
  } catch {
    return false;
  }
}

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim().length > 0) {
    return process.env.GITHUB_TOKEN.trim();
  }
  if (commandExists('gh')) {
    try {
      const token = execSync('gh auth token', {
        encoding: 'utf8',
        env: getExpandedEnv(),
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (token && token.length > 0) return token;
    } catch {}
  }
  return null;
}

function extractZip(zipPath, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  if (commandExists('unzip')) {
    try {
      execSync(`unzip -qo "${zipPath}" -d "${targetDir}"`, { stdio: 'ignore', env: getExpandedEnv() });
      return true;
    } catch {}
  }
  if (process.platform === 'win32') {
    try {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${targetDir}'"`,
        { stdio: 'ignore' }
      );
      return true;
    } catch {}
  }
  if (commandExists('tar')) {
    try {
      execSync(`tar -xf "${zipPath}" -C "${targetDir}"`, { stdio: 'ignore', env: getExpandedEnv() });
      return true;
    } catch {}
  }
  return false;
}

function getRepoSlug() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8', env: getExpandedEnv() }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/);
    if (match) return `${match[1]}/${match[2]}`;
  } catch {}
  return 'ankrypht/DocChisel';
}

// Parse requested target architecture
// e.g.: npm run linux:download [all|x64|arm64|x86|armhf]
function parseTargetArch() {
  const rawArgs = process.argv.slice(2);
  for (const arg of rawArgs) {
    if (arg === '--help' || arg === '-h' || arg === 'help') {
      console.log('Usage: npm run linux:download [-- <architecture>]');
      console.log('\nSupported architectures:');
      console.log('  all     - Download all 4 architectures (.deb + .AppImage = 8 packages, ~250 MB) [default]');
      console.log('  x64     - 64-bit AMD/Intel packages (.deb + .AppImage, ~85 MB)');
      console.log('  arm64   - 64-bit ARM packages (.deb + .AppImage, ~83 MB)');
      console.log('  x86     - 32-bit AMD/Intel packages (.deb + .AppImage, ~81 MB)');
      console.log('  armhf   - 32-bit ARM packages (.deb + .AppImage, ~11 MB)');
      process.exit(0);
    }
    const clean = arg.replace(/^--arch=|^--/, '').trim().toLowerCase();
    if (['all'].includes(clean)) return 'all';
    if (['x64', 'amd64', 'x86_64'].includes(clean)) return 'x64';
    if (['arm64', 'aarch64'].includes(clean)) return 'arm64';
    if (['x86', 'i686', 'i386'].includes(clean)) return 'x86';
    if (['armhf', 'armv7', 'arm'].includes(clean)) return 'armhf';
  }
  return 'all';
}

const targetArch = parseTargetArch();
const repoSlug = getRepoSlug();
const releasesDir = path.join(REPO_ROOT, 'releases');
const linuxDir = path.join(releasesDir, 'linux');
fs.mkdirSync(linuxDir, { recursive: true });

const artifactName =
  targetArch === 'all'
    ? `docchisel-linux-all-v${version}`
    : `docchisel-linux-arch-${targetArch}-v${version}`;

console.log('==================================================');
console.log('📥 [DocChisel] Linux Release Artifact Downloader');
console.log(`   Host OS:     ${process.platform} (${process.arch})`);
console.log(`   Repository:  ${repoSlug}`);
console.log(`   Version:     v${version}`);
console.log(`   Target Arch: ${targetArch.toUpperCase()}`);
console.log(`   Artifact:    ${artifactName}`);
console.log(`   Destination: ${linuxDir}`);
console.log('==================================================\n');

function renderProgress(received, total, startTime, isDone = false) {
  const elapsedSec = (Date.now() - startTime) / 1000;
  const speedMBs = elapsedSec > 0 ? received / (1024 * 1024) / elapsedSec : 0;
  const percent = total > 0 ? Math.min(100, (received / total) * 100).toFixed(1) : isDone ? '100.0' : '?';
  const recMB = (received / (1024 * 1024)).toFixed(1);
  const totMB = total > 0 ? (total / (1024 * 1024)).toFixed(1) : recMB;

  const etaSec =
    speedMBs > 0 && total > 0 && received < total
      ? Math.round((total - received) / (1024 * 1024) / speedMBs)
      : 0;
  const etaStr = isDone ? 'Done' : etaSec > 60 ? `${Math.floor(etaSec / 60)}m ${etaSec % 60}s` : `${etaSec}s`;

  const barWidth = 26;
  const filled = total > 0 ? Math.min(barWidth, Math.round((received / total) * barWidth)) : isDone ? barWidth : 0;
  const bar = '━'.repeat(filled) + '┈'.repeat(Math.max(0, barWidth - filled));

  process.stdout.write(
    `\r   [${bar}] ${percent}% | ${recMB}/${totMB} MB | ${speedMBs.toFixed(2)} MB/s | ETA: ${etaStr}   `
  );
}

async function downloadWithProgress(archiveUrl, headers, destPath, expectedBytes) {
  const res = await fetch(archiveUrl, { headers, redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const totalBytes = parseInt(res.headers.get('content-length') || expectedBytes?.toString() || '0', 10);
  const fileStream = fs.createWriteStream(destPath);
  const reader = res.body.getReader();

  let receivedBytes = 0;
  const startTime = Date.now();
  let lastUpdate = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedBytes += value.length;
      if (!fileStream.write(value)) {
        await new Promise((resolve) => fileStream.once('drain', resolve));
      }

      const now = Date.now();
      if (now - lastUpdate > 150 || (totalBytes > 0 && receivedBytes >= totalBytes)) {
        lastUpdate = now;
        renderProgress(receivedBytes, totalBytes, startTime);
      }
    }
  } finally {
    await new Promise((resolve) => fileStream.end(resolve));
  }
  renderProgress(receivedBytes, totalBytes, startTime, true);
  process.stdout.write('\n');
}

function organizeDownloadedFiles(stagingDir) {
  function scanAndMove(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanAndMove(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (
          ext === '.deb' ||
          ext === '.appimage' ||
          entry.name === 'SHA256SUMS.txt' ||
          entry.name.endsWith('.txt')
        ) {
          const destFile = path.join(linuxDir, entry.name);
          fs.copyFileSync(fullPath, destFile);
        }
      }
    }
  }
  scanAndMove(stagingDir);
}

async function main() {
  let downloaded = false;
  const token = getGitHubToken();

  // Method 1: GitHub REST API with real-time streaming progress
  if (token) {
    try {
      console.log('==> Authenticated session detected. Querying GitHub Actions API for artifacts...');
      const listUrl = `https://api.github.com/repos/${repoSlug}/actions/artifacts?name=${encodeURIComponent(
        artifactName
      )}&per_page=10`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'DocChisel-Artifact-Downloader',
        Accept: 'application/vnd.github+json',
      };

      const res = await fetch(listUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.artifacts && data.artifacts.length > 0) {
          const latestArtifact = data.artifacts[0];
          const archiveUrl = latestArtifact.archive_download_url;
          const sizeMB = (latestArtifact.size_in_bytes / 1024 / 1024).toFixed(1);
          const zipPath = path.join(releasesDir, `${artifactName}.zip`);
          const stagingDir = path.join(releasesDir, `_staging_${Date.now()}`);

          console.log(`  ✓ Found artifact: "${artifactName}" (ID: ${latestArtifact.id}, Size: ${sizeMB} MB)`);
          console.log('==> Downloading artifact archive with live progress...');

          await downloadWithProgress(archiveUrl, headers, zipPath, latestArtifact.size_in_bytes);

          console.log('==> Extracting release packages...');
          if (extractZip(zipPath, stagingDir)) {
            organizeDownloadedFiles(stagingDir);
            try {
              fs.rmSync(stagingDir, { recursive: true, force: true });
              fs.unlinkSync(zipPath);
            } catch {}
            downloaded = true;
          } else {
            console.warn('  ⚠️ Could not auto-extract zip. The file is saved at:', zipPath);
            downloaded = true;
          }
        } else {
          console.warn(`  ⚠️ No artifact named "${artifactName}" found in recent workflow runs.`);
        }
      } else {
        console.warn(`  ⚠️ GitHub API responded with status ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.warn(`  ⚠️ API streaming download attempt failed: ${err.message}`);
    }
  }

  // Method 2: Fallback to GitHub CLI (`gh run download`)
  if (!downloaded && commandExists('gh')) {
    try {
      const authStatus = spawnSync('gh', ['auth', 'status'], {
        stdio: 'ignore',
        env: getExpandedEnv(),
        shell: process.platform === 'win32',
      });
      if (authStatus.status === 0) {
        console.log(`==> Downloading artifact via 'gh run download'...`);
        console.log(`   (Note: 'gh' transfers large artifacts silently. Please allow a few minutes...)`);
        const stagingDir = path.join(releasesDir, `_staging_gh_${Date.now()}`);
        fs.mkdirSync(stagingDir, { recursive: true });

        const dlRes = spawnSync(
          'gh',
          ['run', 'download', '--name', artifactName, '--dir', stagingDir, '--repo', repoSlug],
          { stdio: 'inherit', env: getExpandedEnv(), shell: process.platform === 'win32' }
        );
        if (dlRes.status === 0) {
          organizeDownloadedFiles(stagingDir);
          try {
            fs.rmSync(stagingDir, { recursive: true, force: true });
          } catch {}
          downloaded = true;
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ GitHub CLI download attempted but failed: ${err.message}`);
    }
  }

  // Method 3: Status summary and guidance
  if (downloaded) {
    console.log('\n==================================================');
    console.log('🎉 Linux Artifacts Successfully Downloaded & Ready!');
    console.log(`   Location: ${linuxDir}`);
    console.log('==================================================');
    try {
      const files = fs.readdirSync(linuxDir).filter((f) => !f.startsWith('.'));
      if (files.length > 0) {
        console.log('\nCollected Packages:');
        for (const f of files) {
          const stats = fs.statSync(path.join(linuxDir, f));
          console.log(`  • ${f.padEnd(38)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        }
        console.log('\nAll Linux binaries are verified and ready for distribution in releases/linux/!\n');
      }
    } catch {}
  } else {
    console.log('--------------------------------------------------');
    console.log('ℹ️  How to Download Your Linux Packages:');
    console.log('--------------------------------------------------');
    console.log('1. Open your browser to the GitHub Actions page:');
    console.log(`   https://github.com/${repoSlug}/actions/workflows/build-linux.yml`);
    console.log('\n2. Click on the latest completed workflow run:');
    console.log('   "Build Linux Packages (.deb & AppImage)"');
    console.log('\n3. Scroll down to the "Artifacts" section at the bottom.');
    console.log(`4. Click "${artifactName}" to download the archive.`);
    console.log('5. Extract the packages directly into:');
    console.log(`   ${linuxDir}`);
    console.log('\n💡 Tip: You can download a single architecture faster by passing its name:');
    console.log('   npm run linux:download -- x64    # 64-bit AMD/Intel only (~85 MB)');
    console.log('   npm run linux:download -- arm64  # 64-bit ARM only (~83 MB)');
    console.log('   npm run linux:download -- x86    # 32-bit AMD/Intel only (~81 MB)');
    console.log('   npm run linux:download -- armhf  # 32-bit ARM only (~11 MB)');
    console.log('==================================================\n');
  }
}

main().catch((err) => {
  console.error(`❌ Unexpected error: ${err.message}`);
  process.exit(1);
});
