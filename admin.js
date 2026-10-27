(() => {
  const PASSWORD_KEY = 'shenweiAdminPassword';
  const loginForm = document.querySelector('#adminLoginForm');
  const loginResult = document.querySelector('#adminLoginResult');
  const passwordInput = document.querySelector('#adminPassword');

  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = loginForm.querySelector('[type="submit"]');
    submit.disabled = true;
    loginResult.textContent = '正在验证…';
    try {
      const password = passwordInput.value;
      const response = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || '登录失败，请稍后重试。');
      sessionStorage.setItem(PASSWORD_KEY, password);
      location.replace('admin-dashboard.html');
    } catch (error) {
      loginResult.textContent = error.message;
      passwordInput.select();
    } finally {
      submit.disabled = false;
    }
  });

  const list = document.querySelector('#inquiryList');
  if (!list) return;
  const password = sessionStorage.getItem(PASSWORD_KEY);
  if (!password) {
    location.replace('admin-login.html');
    return;
  }

  let inquiries = [];
  let pendingDelete = null;
  const result = document.querySelector('#dashboardResult');
  const template = document.querySelector('#inquiryTemplate');
  const dialog = document.querySelector('#deleteDialog');
  const search = document.querySelector('#inquirySearch');
  const headers = () => ({ authorization: `Bearer ${sessionStorage.getItem(PASSWORD_KEY) || ''}` });
  const formatDate = value => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  const isToday = value => {
    const date = new Date(value), now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  };

  function render() {
    const term = search.value.trim().toLowerCase();
    const filtered = inquiries.filter(item => [item.name, item.company, item.email, item.phone, item.message].some(value => String(value || '').toLowerCase().includes(term)));
    list.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty';
      const strong = document.createElement('strong');
      strong.textContent = inquiries.length ? '没有符合搜索条件的记录' : '暂时没有咨询记录';
      const span = document.createElement('span');
      span.textContent = inquiries.length ? '请尝试其他关键词' : '新提交的联系表单会显示在这里';
      empty.append(strong, span); list.append(empty); return;
    }
    filtered.forEach(item => {
      const card = template.content.firstElementChild.cloneNode(true);
      const set = (field, value) => { card.querySelector(`[data-field="${field}"]`).textContent = value || '—'; };
      set('name', item.name); set('company', item.company || '个人咨询'); set('phone', item.phone); set('message', item.message); set('id', item.id);
      const time = card.querySelector('[data-field="createdAt"]'); time.dateTime = item.createdAt; time.textContent = formatDate(item.createdAt);
      const email = card.querySelector('[data-field="email"]'); email.textContent = item.email; email.href = `mailto:${item.email}`;
      card.querySelector('.admin-delete').addEventListener('click', () => { pendingDelete = item.id; dialog.showModal(); });
      list.append(card);
    });
  }

  async function load() {
    list.setAttribute('aria-busy', 'true'); result.textContent = '';
    try {
      const response = await fetch('/api/admin/inquiries', { headers: headers() });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) { sessionStorage.removeItem(PASSWORD_KEY); location.replace('admin-login.html'); return; }
      if (!response.ok) throw new Error(payload.error || '读取失败，请稍后重试。');
      inquiries = Array.isArray(payload.inquiries) ? payload.inquiries : [];
      document.querySelector('#inquiryCount').textContent = inquiries.length;
      document.querySelector('#todayCount').textContent = inquiries.filter(item => isToday(item.createdAt)).length;
      document.querySelector('#lastUpdated').textContent = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date());
      render();
    } catch (error) {
      result.textContent = error.message;
      list.innerHTML = '<div class="admin-empty"><strong>暂时无法读取记录</strong><span>请检查网络后重试</span></div>';
    } finally { list.setAttribute('aria-busy', 'false'); }
  }

  dialog.addEventListener('close', async () => {
    if (dialog.returnValue !== 'confirm' || !pendingDelete) { pendingDelete = null; return; }
    const id = pendingDelete; pendingDelete = null; result.textContent = '正在删除…';
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers() });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) { sessionStorage.removeItem(PASSWORD_KEY); location.replace('admin-login.html'); return; }
      if (!response.ok) throw new Error(payload.error || '删除失败。');
      inquiries = inquiries.filter(item => item.id !== id); result.textContent = '记录已删除。'; render();
      document.querySelector('#inquiryCount').textContent = inquiries.length;
      document.querySelector('#todayCount').textContent = inquiries.filter(item => isToday(item.createdAt)).length;
    } catch (error) { result.textContent = error.message; }
  });
  search.addEventListener('input', render);
  document.querySelector('#refreshInquiries').addEventListener('click', load);
  document.querySelector('#adminLogout').addEventListener('click', () => { sessionStorage.removeItem(PASSWORD_KEY); location.replace('admin-login.html'); });
  load();
})();
