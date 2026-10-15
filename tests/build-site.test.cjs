const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, mkdir, open, readFile, readdir, rm, stat, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, resolve, sep } = require('node:path');

async function fixture(t) {
  const parent = resolve(tmpdir());
  const root = await mkdtemp(join(parent, 'aishenwei-build-test-'));
  t.after(async () => {
    assert.ok(resolve(root).startsWith(parent + sep + 'aishenwei-build-test-'));
    await rm(root, { recursive: true, force: true });
  });
  for (const directory of ['images', 'pictures']) await mkdir(join(root, directory));
  await writeFile(join(root, 'index.html'), '<h1>Website</h1>');
  return root;
}

test('deployment includes public assets and excludes tooling, dependencies and stale output', async t => {
  const { buildSite } = await import('../tools/build-site.mjs');
  const root = await fixture(t);
  for (const file of ['styles.css', 'script.js', '_redirects', '_headers', 'images/icon.svg', 'pictures/产品.webp', 'pictures/responsive/产品-480.webp', 'package.json', '.env', 'README.md', 'node_modules/workerd/bin/workerd', 'tools/internal.js', 'samples/example.html', 'dist/stale.html']) {
    const destination = join(root, file);
    await mkdir(require('node:path').dirname(destination), { recursive: true });
    await writeFile(destination, file);
  }
  const result = await buildSite(root);
  assert.equal(result.files, 8);
  assert.deepEqual((await readdir(join(root, 'dist'))).sort(), ['_headers', '_redirects', 'images', 'index.html', 'pictures', 'script.js', 'styles.css']);
  assert.equal(await readFile(join(root, 'dist/pictures/responsive/产品-480.webp'), 'utf8'), 'pictures/responsive/产品-480.webp');
  assert.equal(await readFile(join(root, 'dist/pictures/产品.webp'), 'utf8'), 'pictures/产品.webp');
  assert.equal(await readFile(join(root, 'node_modules/workerd/bin/workerd'), 'utf8'), 'node_modules/workerd/bin/workerd');
});

test('oversized public assets fail before replacing an existing build', async t => {
  const { buildSite } = await import('../tools/build-site.mjs');
  const root = await fixture(t);
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist/index.html'), 'previous build');
  const oversized = await open(join(root, 'pictures/oversized.webp'), 'w');
  try { await oversized.truncate(25 * 1024 * 1024 + 1); }
  finally { await oversized.close(); }
  await assert.rejects(buildSite(root), /25 MiB limit/);
  assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), 'previous build');
});

test('mobile hero uses a preloaded lightweight candidate', async () => {
  const root = resolve(__dirname, '..');
  const html = await readFile(join(root, 'index.html'), 'utf8');
  assert.match(html, /rel="preload"[^>]+智能轮椅产品-480\.webp/);
  assert.match(html, /sizes="\(max-width: 640px\) 160px/);
  const mobileHero = await stat(join(root, 'pictures', 'responsive', '智能轮椅产品-480.webp'));
  assert.ok(mobileHero.size < 30 * 1024, `mobile hero is ${mobileHero.size} bytes`);
});
