import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOBILE_DIR = path.resolve(__dirname, '../apps/mobile');

const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const filteredArgs = args.filter((a) => a !== '--dev');

const env = { ...process.env };
if (isDev) {
  env.APP_VARIANT = 'development';
}

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCmd, ['expo', ...filteredArgs], {
  cwd: MOBILE_DIR,
  stdio: 'inherit',
  shell: isWin,
  env,
});

process.exit(result.status ?? 0);
