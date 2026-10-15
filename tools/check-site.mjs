import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = (await readdir(root)).filter(name => /\.(html|css|js)$/.test(name));
const failures = [];
let references = 0, scripts = 0;
const syntax = (code, filename) => {
  try { new vm.Script(code, { filename }); scripts++; }
  catch (error) { failures.push(`${filename}: ${error.message}`); }
};
for (const file of files) {
  const text = await readFile(resolve(root, file), 'utf8');
  if (file.endsWith('.js')) syntax(text, file);
  if (file.endsWith('.html')) {
    if (!/<html\b[^>]*lang=/.test(text)) failures.push(`${file}: missing document language`);
    if (!/<meta\b[^>]*name="viewport"/.test(text)) failures.push(`${file}: missing viewport`);
    if (!/<title[^>]*>[^<]+<\/title>/.test(text)) failures.push(`${file}: missing title`);
    const ids = [...text.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) failures.push(`${file}: duplicate id ${id}`);
    for (const [index, match] of [...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries()) {
      if (!/\bsrc=|application\/ld\+json/.test(match[1]) && match[2].trim()) syntax(match[2], `${file}:inline-${index}`);
    }
    if (/<button\b[^>]*class="nav-toggle"[^>]*onclick=/.test(text)) failures.push(`${file}: duplicate menu event binding`);
    if (text.includes('example-lab-website.com')) failures.push(`${file}: placeholder destination`);
    if (text.includes('// 强制全屏滚动脚本')) failures.push(`${file}: legacy scroll interception`);
  }
  // All literal local HTML attributes and CSS URLs must exist; dynamic templates are skipped.
  const links = [...text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)'"\s]+)/g)];
  for (const match of links) {
    const value = match[1] || match[2];
    if (/^(#|\/\/|[a-z][a-z\d+.-]*:)/i.test(value) || value.includes('${')) continue;
    const path = decodeURIComponent(value.split(/[?#]/)[0]);
    if (!path || path.includes('<')) continue;
    // Ignore JavaScript string expressions which are not literal asset URLs.
    if (!/\.(html|css|js|svg|webp|png|jpe?g)$/i.test(path)) continue;
    references++;
    try { await access(resolve(dirname(resolve(root, file)), path)); }
    catch { failures.push(`${file}: missing ${path}`); }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(`PASS: ${files.length} source files, ${scripts} scripts parsed, ${references} local references resolved.`);
