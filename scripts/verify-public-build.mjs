// Build with PUBLIC_BUILD=true and fail if any internal page or project data reaches dist/
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const dist = join(root, 'dist');

// Strings only the internal build may contain
const forbidden = [
  '/project/',
  'Internal view',
  'Project view (internal)',
  'L1_WC1_M1',
  'Pilot machine',
  'OEE design v0.5',
];

const build = spawnSync('npx astro build', {
  cwd: root,
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, PUBLIC_BUILD: 'true' },
});
if (build.status !== 0) {
  console.error('Public build failed');
  process.exit(1);
}

const failures = [];

if (existsSync(join(dist, 'products', 'mes', 'project'))) {
  failures.push('dist/products/mes/project/ exists');
}
if (!existsSync(join(dist, 'products', 'mes', 'index.html'))) {
  failures.push('dist/products/mes/index.html is missing');
}

// Scan every generated text file for internal markers
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(html|js|css|json|xml|txt)$/.test(name)) files.push(path);
  }
  return files;
}

for (const file of walk(dist)) {
  const text = readFileSync(file, 'utf8');
  for (const marker of forbidden) {
    if (text.includes(marker)) {
      failures.push(`${relative(root, file)} contains "${marker}"`);
    }
  }
}

if (failures.length > 0) {
  console.error('Public build check failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Public build check passed: no /project/ output, no internal markers in dist/');
