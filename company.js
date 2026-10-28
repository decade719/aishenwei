(() => {
  const nav = document.querySelector('.company-nav');
  const toggle = document.querySelector('.menu-button');
  const panel = document.querySelector('.nav-panel');
  const closeMenu = () => { nav?.setAttribute('data-open', 'false'); toggle?.setAttribute('aria-expanded', 'false'); };
  toggle?.addEventListener('click', () => {
    const open = nav.dataset.open !== 'true';
    nav.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  panel?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.company-header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.dataset.open === 'true') { closeMenu(); toggle.focus(); }
  });
  document.querySelector('.company-header')?.addEventListener('focusout', event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenu();
  });
  matchMedia('(min-width:1181px)').addEventListener('change', closeMenu);

  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const theme = document.querySelector('.theme-switch');
  function setTheme(value) {
    document.documentElement.dataset.companyTheme = value;
    theme?.setAttribute('aria-pressed', String(value === 'dark'));
    if (theme) theme.textContent = value === 'dark' ? '☀' : '☾';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value === 'dark' ? '#050b18' : '#f9fbfd');
  }
  // Every page opens in the brand's dark presentation, including returning visits.
  setTheme('dark');
  theme?.addEventListener('click', () => {
    const value = document.documentElement.dataset.companyTheme === 'dark' ? 'light' : 'dark';
    setTheme(value);
  });

  // Company pages carry their own complete Chinese/English text, without the old academic dictionary.
  const language = document.querySelector('#companyLanguage');
  document.querySelectorAll('[data-en]').forEach(element => { element.dataset.zh = element.textContent; });
  function setLanguage(value) {
    const english = value === 'en';
    document.documentElement.lang = english ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-en]').forEach(element => { element.textContent = english ? element.dataset.en : element.dataset.zh; });
    document.querySelectorAll('[data-placeholder-en]').forEach(element => {
      element.dataset.placeholderZh ||= element.placeholder;
      element.placeholder = english ? element.dataset.placeholderEn : element.dataset.placeholderZh;
    });
    toggle?.setAttribute('aria-label', english ? 'Toggle navigation menu' : '打开或关闭导航菜单');
    theme?.setAttribute('aria-label', english ? 'Toggle dark theme' : '切换深浅主题');
    if (language) language.value = english ? 'en' : 'zh-CN';
    document.title = english ? document.documentElement.dataset.titleEn : document.documentElement.dataset.titleZh;
    const url = new URL(location.href); url.searchParams.set('lang', english ? 'en' : 'zh-CN');
    history.replaceState(null, '', url);
    document.querySelectorAll('a[href]').forEach(link => {
      const destination = new URL(link.getAttribute('href'), location.href);
      if (destination.origin === location.origin && /\.html$/.test(destination.pathname)) {
        destination.searchParams.set('lang', english ? 'en' : 'zh-CN');
        link.href = destination.href;
      }
    });
  }
  document.documentElement.dataset.titleZh = document.title;
  const requested = new URL(location.href).searchParams.get('lang');
  setLanguage(requested === 'en' || (!requested && read('company-language') === 'en') ? 'en' : 'zh-CN');
  language?.addEventListener('change', () => { setLanguage(language.value); write('company-language', language.value); });

  const form = document.querySelector('#companyContact');
  if (form) {
    form.elements.formStartedAt.value = String(Date.now());
    const product = new URL(location.href).searchParams.get('product');
    const message = form.elements.message;
    const products = { indoor: ['室内版', 'Indoor'], outdoor: ['室外导航版', 'Outdoor navigation'], roaming: ['室外漫游版', 'Outdoor roaming'], flagship: ['综合版', 'Integrated'] };
    if (products[product]) message.value = document.documentElement.lang === 'en' ? `I would like to learn about the ${products[product][1]} wheelchair.` : `我想了解智能轮椅${products[product][0]}的产品方案。`;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const result = document.querySelector('#contactResult');
      const english = document.documentElement.lang === 'en';
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      result.textContent = english ? 'Submitting…' : '正在提交…';
      try {
        const data = Object.fromEntries(new FormData(form));
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data)
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Submit failed');
        form.reset();
        form.elements.formStartedAt.value = String(Date.now());
        result.textContent = english ? 'Thank you. Your enquiry has been submitted.' : '提交成功，感谢你的咨询，我们会尽快跟进。';
      } catch (error) {
        result.textContent = english ? 'Submission failed. Your text has been retained; please try again later.' : (error.message || '提交失败，输入内容已保留，请稍后重试。');
      } finally {
        submit.disabled = false;
      }
    });
  }
})();
