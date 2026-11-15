import process from 'node:process';
import console from 'node:console';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = `${root}dist/extension`;
const manifest = JSON.parse(await readFile(`${dir}/manifest.json`, 'utf8'));
const pkg = JSON.parse(await readFile(`${root}package.json`, 'utf8'));
assert.equal(manifest.version, pkg.version, 'Manifest/package versions differ');
if (process.env.GITHUB_REF_TYPE === 'tag')
  assert.equal(
    process.env.GITHUB_REF_NAME,
    `v${pkg.version}`,
    'Tag/version mismatch',
  );
const files = [];
async function walk(path = '') {
  for (const entry of await readdir(`${dir}/${path}`, {
    withFileTypes: true,
  })) {
    const name = path + entry.name;
    assert.ok(!entry.isSymbolicLink(), 'No symlinks in extension');
    if (entry.isDirectory()) await walk(`${name}/`);
    else {
      assert.match(
        name,
        /^(LICENSE|manifest\.json|popup\.html|contentScript\.js|assets\/[\w.-]+\.(js|css)|icons\/icon-(16|32|48|128)\.png)$/,
      );
      files.push(name);
    }
  }
}
await walk();
for (const path of [
  'LICENSE',
  manifest.action.default_popup,
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  ...manifest.content_scripts.flatMap((item) => item.js),
])
  assert.ok(files.includes(path), `Missing manifest asset: ${path}`);
const html = await readFile(`${dir}/popup.html`, 'utf8');
for (const [, path] of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g))
  assert.ok(files.includes(path), `Missing popup asset: ${path}`);
await mkdir(`${root}dist/packages`, { recursive: true });
const name = `cmt-autofill-${pkg.version}.zip`;
const output = `${root}dist/packages/${name}`;
// Remove previous archive so zip never retains stale entries.
const { rm } = await import('node:fs/promises');
await rm(output, { force: true });
execFileSync('zip', ['-X', '-q', output, ...files.sort()], { cwd: dir });
execFileSync('unzip', ['-t', output]);
const entries = execFileSync('unzip', ['-Z1', output], { encoding: 'utf8' })
  .trim()
  .split('\n');
assert.deepEqual(entries, files.sort());
const hash = createHash('sha256')
  .update(await readFile(output))
  .digest('hex');
await writeFile(`${output}.sha256`, `${hash}  ${name}\n`);
console.log(`Verified ${output}\nSHA-256 ${hash}`);
