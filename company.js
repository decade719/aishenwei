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
  }
  setTheme(read('company-theme') === 'dark' ? 'dark' : 'light');
  theme?.addEventListener('click', () => {
    const value = document.documentElement.dataset.companyTheme === 'dark' ? 'light' : 'dark';
    setTheme(value); write('company-theme', value);
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
    const product = new URL(location.href).searchParams.get('product');
    const message = form.elements.message;
    const products = { indoor: ['室内版', 'Indoor'], outdoor: ['室外导航版', 'Outdoor navigation'], roaming: ['室外漫游版', 'Outdoor roaming'], flagship: ['综合版', 'Integrated'] };
    if (products[product]) message.value = document.documentElement.lang === 'en' ? `I would like to learn about the ${products[product][1]} wheelchair.` : `我想了解智能轮椅${products[product][0]}的产品方案。`;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const result = document.querySelector('#contactResult');
      const english = document.documentElement.lang === 'en';
      try {
        if (!window.formSubmissionManager) throw new Error('Draft storage unavailable');
        const data = Object.fromEntries(new FormData(form));
        window.formSubmissionManager.saveMessage(data);
        result.textContent = english ? 'Draft saved in this browser. It has not been sent to the company.' : '需求草稿已保存在本机浏览器，尚未发送给企业。';
      } catch {
        result.textContent = english ? 'Could not save locally. Your text is retained; please check browser storage settings.' : '本机保存失败，输入内容已保留。请检查浏览器存储设置。';
      }
    });
  }
})();
