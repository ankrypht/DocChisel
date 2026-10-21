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

function commandExists(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function extractZip(zipPath, targetDir) {
  if (commandExists('unzip')) {
    try {
      execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, { stdio: 'inherit' });
      return true;
    } catch {}
  }
  if (process.platform === 'win32') {
    try {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${targetDir}'"`, { stdio: 'inherit' });
      return true;
    } catch {}
  }
  if (commandExists('tar')) {
    try {
      execSync(`tar -xf "${zipPath}" -C "${targetDir}"`, { stdio: 'inherit' });
      return true;
    } catch {}
  }
  return false;
}

function getRepoSlug() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/);
    if (match) return `${match[1]}/${match[2]}`;
  } catch {}
  return 'ankrypht/DocChisel';
}

const repoSlug = getRepoSlug();
const artifactName = `docchisel-linux-all-v${version}`;
const releasesDir = path.join(REPO_ROOT, 'releases');
fs.mkdirSync(releasesDir, { recursive: true });

console.log('==================================================');
console.log('📥 [DocChisel] Linux Release Artifact Downloader');
console.log(`   Host OS:     ${process.platform} (${process.arch})`);
console.log(`   Repository:  ${repoSlug}`);
console.log(`   Version:     v${version}`);
console.log(`   Target:      ${artifactName}`);
console.log(`   Destination: ${releasesDir}`);
console.log('==================================================\n');

async function main() {
  let downloaded = false;

  // 1. Try using GitHub CLI (`gh`) if available and authenticated
  if (commandExists('gh')) {
    try {
      const authStatus = spawnSync('gh', ['auth', 'status'], {
        stdio: 'ignore',
        shell: process.platform === 'win32',
      });
      if (authStatus.status === 0) {
        console.log('==> Detected authenticated GitHub CLI (`gh`). Downloading artifact...');
        const dlRes = spawnSync(
          'gh',
          ['run', 'download', '--name', artifactName, '--dir', releasesDir, '--repo', repoSlug],
          { stdio: 'inherit', shell: process.platform === 'win32' }
        );
        if (dlRes.status === 0) {
          downloaded = true;
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ GitHub CLI download attempted but failed: ${err.message}`);
    }
  }

  // 2. Try using native Node fetch + GITHUB_TOKEN if provided
  if (!downloaded && process.env.GITHUB_TOKEN) {
    try {
      console.log('==> Attempting download via GitHub REST API using GITHUB_TOKEN...');
      const listUrl = `https://api.github.com/repos/${repoSlug}/actions/artifacts?name=${encodeURIComponent(artifactName)}`;
      const headers = {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'DocChisel-Artifact-Downloader',
        'Accept': 'application/vnd.github+json',
      };

      const res = await fetch(listUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.artifacts && data.artifacts.length > 0) {
          const latestArtifact = data.artifacts[0];
          const archiveUrl = latestArtifact.archive_download_url;
          const zipPath = path.join(releasesDir, `${artifactName}.zip`);

          console.log(`  ✓ Found artifact ID: ${latestArtifact.id} (${(latestArtifact.size_in_bytes / 1024 / 1024).toFixed(1)} MB)`);
          console.log('  ℹ️ Downloading zip archive...');

          const dlRes = await fetch(archiveUrl, { headers });
          if (dlRes.ok) {
            const buffer = Buffer.from(await dlRes.arrayBuffer());
            fs.writeFileSync(zipPath, buffer);
            console.log('  ℹ️ Extracting packages into releases/ ...');
            if (extractZip(zipPath, releasesDir)) {
              try { fs.unlinkSync(zipPath); } catch {}
              downloaded = true;
            }
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ GitHub API download attempted: ${err.message}`);
    }
  }

  // 3. Status summary and guidance
  if (downloaded) {
    console.log('\n==================================================');
    console.log('🎉 Linux Artifacts Successfully Downloaded & Ready!');
    console.log(`   Destination: ${path.join(releasesDir, 'linux')}`);
    console.log('==================================================');
    try {
      const linuxDir = path.join(releasesDir, 'linux');
      if (fs.existsSync(linuxDir)) {
        const files = fs.readdirSync(linuxDir);
        console.log('\nDownloaded Files:');
        for (const f of files) {
          const stats = fs.statSync(path.join(linuxDir, f));
          console.log(`  • ${f} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        }
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
    console.log(`4. Click "${artifactName}" to download the complete zip bundle.`);
    console.log('5. Extract the zip file directly into your local DocChisel directory:');
    if (process.platform === 'win32') {
      console.log(`   Expand-Archive -Force -Path ~\\Downloads\\${artifactName}.zip -DestinationPath ${releasesDir}\\`);
    } else {
      console.log(`   unzip ~/Downloads/${artifactName}.zip -d ${releasesDir}/`);
    }
    console.log('\nAlternatively, install the GitHub CLI and run:');
    if (process.platform === 'win32') {
      console.log('   winget install --id GitHub.cli');
    } else if (process.platform === 'darwin') {
      console.log('   brew install gh');
    } else {
      console.log('   sudo apt install gh # or your distro package manager');
    }
    console.log('   gh auth login');
    console.log('   npm run linux:download');
    console.log('==================================================\n');
  }
}

main().catch((err) => {
  console.error(`❌ Unexpected error: ${err.message}`);
  process.exit(1);
});
