import { copyFile, lstat, mkdir, readdir, realpath, rm, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const maxAssetBytes = 25 * 1024 * 1024;
const imagePattern = /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i;

export async function buildSite(sourceRoot) {
  const root = await realpath(sourceRoot);
  const output = resolve(root, 'dist');
  const files = [];

  async function collect(directory, pattern) {
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const relative = join(directory, entry.name);
      if (entry.isFile() && pattern.test(entry.name)) files.push(relative);
      // Only recurse inside the two public image directories, never the repository.
      if (directory && entry.isDirectory()) await collect(relative, pattern);
    }
  }
  await collect('', /\.(html|css|js)$|^_(redirects|headers)$/i);
  for (const directory of ['images', 'pictures']) {
    const info = await lstat(join(root, directory));
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Invalid asset directory: ${directory}`);
    await collect(directory, imagePattern);
  }
  if (!files.includes('index.html')) throw new Error('Missing index.html');

  let totalBytes = 0, largestBytes = 0;
  for (const file of files) {
    const { size } = await stat(join(root, file));
    if (size > maxAssetBytes) throw new Error(`Asset exceeds the 25 MiB limit: ${file}`);
    totalBytes += size;
    largestBytes = Math.max(largestBytes, size);
  }

  // Clean only this project's generated dist directory; refuse redirected targets.
  if (dirname(output) !== root || basename(output) !== 'dist') throw new Error('Invalid build output path');
  try {
    const existing = await lstat(output);
    if (!existing.isDirectory() || existing.isSymbolicLink()) throw new Error('dist must be a real directory');
    if (await realpath(output) !== output) throw new Error('Refusing redirected dist directory');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of files) {
    const destination = join(output, file);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(root, file), destination);
  }
  return { files: files.length, totalBytes, largestBytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildSite(fileURLToPath(new URL('../', import.meta.url)));
  console.log(`Built dist: ${result.files} public files, ${(result.totalBytes / 1024 / 1024).toFixed(2)} MiB total; largest asset ${(result.largestBytes / 1024 / 1024).toFixed(2)} MiB.`);
}
