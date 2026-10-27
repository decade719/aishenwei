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
  for (const directory of ['images', 'media', 'pictures']) await mkdir(join(root, directory));
  await writeFile(join(root, 'index.html'), '<h1>Website</h1>');
  return root;
}

test('deployment includes public assets and excludes tooling, dependencies and stale output', async t => {
  const { buildSite } = await import('../tools/build-site.mjs');
  const root = await fixture(t);
  for (const file of ['styles.css', 'script.js', '_redirects', '_headers', 'images/icon.svg', 'media/demo.mp4', 'pictures/产品.webp', 'pictures/responsive/产品-480.webp', 'package.json', '.env', 'README.md', 'node_modules/workerd/bin/workerd', 'tools/internal.js', 'samples/example.html', 'dist/stale.html']) {
    const destination = join(root, file);
    await mkdir(require('node:path').dirname(destination), { recursive: true });
    await writeFile(destination, file);
  }
  const result = await buildSite(root);
  assert.equal(result.files, 9);
  assert.deepEqual((await readdir(join(root, 'dist'))).sort(), ['_headers', '_redirects', 'images', 'index.html', 'media', 'pictures', 'script.js', 'styles.css']);
  assert.equal(await readFile(join(root, 'dist/media/demo.mp4'), 'utf8'), 'media/demo.mp4');
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

test('product demos stay click-to-load and within the mobile media budget', async () => {
  const root = resolve(__dirname, '..');
  const html = await readFile(join(root, 'product_chair.html'), 'utf8');
  assert.equal((html.match(/<video[^>]+preload="none"/g) || []).length, 2);
  for (const file of ['following-test.mp4', 'maneuver-test.mp4']) {
    const media = await stat(join(root, 'media', file));
    assert.ok(media.size < 5 * 1024 * 1024, `${file} is ${media.size} bytes`);
  }
});

test('official company identity uses the supplied name and lightweight logo', async () => {
  const root = resolve(__dirname, '..');
  const html = await readFile(join(root, 'index.html'), 'utf8');
  assert.match(html, /深维智能科技（镇江）有限公司/);
  assert.match(html, /Shenwei Intelligent Technology \(Zhenjiang\) Co\., Ltd/);
  assert.match(html, /shenwei-logo-mark-96\.png/);
  const logo = await stat(join(root, 'images', 'shenwei-logo-mark.webp'));
  assert.ok(logo.size < 20 * 1024, `website logo is ${logo.size} bytes`);
});

test('prototype front views are compressed and included on the wheelchair page', async () => {
  const root = resolve(__dirname, '..');
  const html = await readFile(join(root, 'product_chair.html'), 'utf8');
  for (const file of ['wheelchair-prototype-front-dark.webp', 'wheelchair-prototype-front-light.webp']) {
    assert.match(html, new RegExp(`media/${file.replace('.', '\\.')}`));
    const image = await stat(join(root, 'media', file));
    assert.ok(image.size < 10 * 1024, `${file} is ${image.size} bytes`);
  }
});

test('online enquiries use the protected worker API instead of browser-only storage', async () => {
  const root = resolve(__dirname, '..');
  const contact = await readFile(join(root, 'contact.html'), 'utf8');
  const company = await readFile(join(root, 'company.js'), 'utf8');
  const admin = await readFile(join(root, 'admin.js'), 'utf8');
  const adminCss = await readFile(join(root, 'admin.css'), 'utf8');
  const worker = await readFile(join(root, 'worker', 'index.js'), 'utf8');
  assert.match(company, /fetch\('\/api\/contact'/);
  assert.doesNotMatch(contact, /form-submission-manager\.js/);
  assert.match(contact, /name="website" type="hidden"/);
  assert.match(contact, /class="admin-entry-icon"/);
  assert.match(admin, /\/api\/admin\/inquiries/);
  assert.match(worker, /env\.ADMIN_PASSWORD/);
  assert.doesNotMatch(worker, /20261027/);
  assert.doesNotMatch(admin, /20261027|adminAuthenticated/);
  assert.doesNotMatch(admin, /togglePassword/);
  assert.match(adminCss, /input::\-ms-reveal/);
});
