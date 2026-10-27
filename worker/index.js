const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
};
const MAX_BODY_BYTES = 16 * 1024;
const loginAttempts = new Map();
const ADMIN_PASSWORD = '20261027';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export function validateInquiry(input) {
  const inquiry = {
    name: clean(input?.name, 80),
    email: clean(input?.email, 160).toLowerCase(),
    phone: clean(input?.phone, 60),
    company: clean(input?.company, 120),
    message: clean(input?.message, 3000)
  };
  if (!inquiry.name || !inquiry.email || !inquiry.message) return { error: '请填写姓名、邮箱和需求说明。' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) return { error: '请填写有效的邮箱地址。' };
  if (inquiry.message.length < 5) return { error: '需求说明请至少填写 5 个字。' };
  return { inquiry };
}

function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(String(a ?? ''));
  const right = new TextEncoder().encode(String(b ?? ''));
  const length = Math.max(left.length, right.length, 1);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index++) difference |= (left[index % left.length] ?? 0) ^ (right[index % right.length] ?? 0);
  return difference === 0;
}

async function readJson(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) throw new Error('PAYLOAD_TOO_LARGE');
  return JSON.parse(text || '{}');
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

function isAuthorized(request) {
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  return Boolean(supplied && timingSafeEqual(supplied, ADMIN_PASSWORD));
}

export class InquiryStore {
  constructor(state) {
    this.storage = state.storage;
    this.recent = new Map();
  }

  async readRecords() {
    const stored = await this.storage.get('inquiries.json');
    if (stored !== undefined) {
      if (typeof stored !== 'string') throw new Error('Invalid inquiries.json storage value');
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Invalid inquiries.json document');
      return parsed;
    }
    const legacy = await this.storage.get('inquiries');
    if (!Array.isArray(legacy)) return [];
    await this.writeRecords(legacy);
    await this.storage.delete('inquiries');
    return legacy;
  }

  async writeRecords(records) {
    await this.storage.put('inquiries.json', JSON.stringify(records));
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/submit') {
      const ip = request.headers.get('x-client-ip') || 'unknown';
      const now = Date.now();
      const attempts = (this.recent.get(ip) || []).filter(time => now - time < 10 * 60 * 1000);
      if (attempts.length >= 5) return json({ error: '提交过于频繁，请稍后再试。' }, 429);
      attempts.push(now);
      this.recent.set(ip, attempts);
      const inquiry = await request.json();
      const records = await this.readRecords();
      const record = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'new', ...inquiry };
      records.push(record);
      if (records.length > 2000) records.splice(0, records.length - 2000);
      await this.writeRecords(records);
      return json({ ok: true, id: record.id }, 201);
    }
    if (request.method === 'GET' && url.pathname === '/inquiries') {
      const records = await this.readRecords();
      return json({ inquiries: [...records].reverse() });
    }
    if (request.method === 'DELETE' && url.pathname.startsWith('/inquiries/')) {
      const id = decodeURIComponent(url.pathname.slice('/inquiries/'.length));
      const records = await this.readRecords();
      const remaining = records.filter(record => record.id !== id);
      if (remaining.length === records.length) return json({ error: '未找到该记录。' }, 404);
      await this.writeRecords(remaining);
      return json({ ok: true });
    }
    return json({ error: 'Not found' }, 404);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!sameOrigin(request)) return json({ error: '请求来源无效。' }, 403);
    const store = env.INQUIRY_STORE.get(env.INQUIRY_STORE.idFromName('company-inquiries'));

    try {
      if (request.method === 'POST' && url.pathname === '/api/contact') {
        const input = await readJson(request);
        if (input.website) return json({ ok: true }, 201);
        const startedAt = Number(input.formStartedAt || 0);
        if (startedAt && Date.now() - startedAt < 1500) return json({ error: '请稍后再提交。' }, 429);
        const result = validateInquiry(input);
        if (result.error) return json({ error: result.error }, 400);
        return store.fetch(new Request('https://store/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-client-ip': request.headers.get('cf-connecting-ip') || 'unknown' },
          body: JSON.stringify(result.inquiry)
        }));
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/login') {
        const client = request.headers.get('cf-connecting-ip') || 'unknown';
        const now = Date.now();
        const attempts = (loginAttempts.get(client) || []).filter(time => now - time < 15 * 60 * 1000);
        if (attempts.length >= 8) return json({ error: '尝试次数过多，请 15 分钟后再试。' }, 429);
        const { password } = await readJson(request);
        if (!timingSafeEqual(password, ADMIN_PASSWORD)) {
          attempts.push(now);
          loginAttempts.set(client, attempts);
          return json({ error: '密码错误。' }, 401);
        }
        loginAttempts.delete(client);
        return json({ ok: true });
      }

      if (url.pathname.startsWith('/api/admin/')) {
        if (!isAuthorized(request)) return json({ error: '登录已失效，请重新登录。' }, 401);
        if (request.method === 'GET' && url.pathname === '/api/admin/inquiries') {
          return store.fetch(new Request('https://store/inquiries'));
        }
        if (request.method === 'DELETE' && url.pathname.startsWith('/api/admin/inquiries/')) {
          const id = url.pathname.slice('/api/admin/inquiries/'.length);
          return store.fetch(new Request(`https://store/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' }));
        }
      }
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      if (error?.message === 'PAYLOAD_TOO_LARGE') return json({ error: '提交内容过长。' }, 413);
      if (error instanceof SyntaxError) return json({ error: '请求格式无效。' }, 400);
      console.error(error);
      return json({ error: '服务暂时不可用，请稍后再试。' }, 500);
    }
  }
};
