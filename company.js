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

  // One lightweight decorative canvas per page; no image downloads or animation library.
  function initializeParticleLight() {
  const effectHost = document.querySelector('.home-hero, .page-head, .product-hero');
  if (effectHost) {
    const layer = document.createElement('div');
    layer.className = 'particle-light';
    layer.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    layer.append(canvas);
    effectHost.classList.add('particle-stage');
    effectHost.prepend(layer);
    const context = canvas.getContext('2d');
    if (context) {
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
      const finePointer = matchMedia('(pointer: fine)');
      const isDark = effectHost.classList.contains('home-hero');
      const pointer = { x: -1000, y: -1000 };
      let width = 0, height = 0, particles = [], frame = 0, previous = 0;
      let inView = true;

      function paint(time = 0) {
        context.clearRect(0, 0, width, height);
        const move = reduceMotion.matches ? 0 : Math.min((time - previous) / 33.33 || 1, 2);
        previous = time;
        const cyan = isDark ? '103,231,235' : '14,142,148';
        const blue = isDark ? '95,164,255' : '36,104,216';
        const reach = width < 640 ? 96 : 142;
        particles.forEach((particle, index) => {
          particle.x += particle.vx * move;
          particle.y += particle.vy * move;
          if (particle.x < -15) particle.x = width + 15;
          if (particle.x > width + 15) particle.x = -15;
          if (particle.y < -15) particle.y = height + 15;
          if (particle.y > height + 15) particle.y = -15;
          const color = index % 3 ? cyan : blue;
          const pulse = reduceMotion.matches ? .8 : .65 + Math.sin(time / 1100 + index) * .25;
          context.fillStyle = `rgba(${color},${pulse * (isDark ? .85 : .58)})`;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          context.fill();
          if (index % 6 === 0) {
            const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 12);
            glow.addColorStop(0, `rgba(${color},${isDark ? .3 : .12})`);
            glow.addColorStop(1, `rgba(${color},0)`);
            context.fillStyle = glow;
            context.fillRect(particle.x - 12, particle.y - 12, 24, 24);
          }
          for (let other = index + 1; other < particles.length; other++) {
            const target = particles[other];
            const distance = Math.hypot(particle.x - target.x, particle.y - target.y);
            if (distance >= reach) continue;
            context.strokeStyle = `rgba(${color},${(1 - distance / reach) * (isDark ? .28 : .14)})`;
            context.lineWidth = .7;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(target.x, target.y);
            context.stroke();
          }
          const distanceToPointer = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
          if (finePointer.matches && distanceToPointer < 180) {
            context.strokeStyle = `rgba(${cyan},${(1 - distanceToPointer / 180) * .55})`;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(pointer.x, pointer.y);
            context.stroke();
          }
        });
        if (pointer.x > 0 && finePointer.matches && !reduceMotion.matches) {
          const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 170);
          glow.addColorStop(0, `rgba(${cyan},${isDark ? .13 : .06})`);
          glow.addColorStop(1, `rgba(${cyan},0)`);
          context.fillStyle = glow;
          context.fillRect(pointer.x - 170, pointer.y - 170, 340, 340);
        }
      }

      function animate(time) {
        frame = requestAnimationFrame(animate);
        if (time - previous >= 33) paint(time);
      }
      function syncAnimation() {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        effectHost.classList.toggle('particles-paused', document.hidden || !inView);
        if (document.hidden || !inView) return;
        paint();
        if (!reduceMotion.matches) frame = requestAnimationFrame(animate);
      }
      function resize() {
        width = effectHost.clientWidth;
        height = effectHost.clientHeight;
        const ratio = Math.min(devicePixelRatio || 1, width < 640 ? 1 : 1.5);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        const count = width < 640 ? 26 : Math.min(76, Math.max(40, Math.round(width * height / 12500)));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - .5) * .55, vy: (Math.random() - .5) * .4,
          radius: .8 + Math.random() * 1.5
        }));
        syncAnimation();
      }
      effectHost.addEventListener('pointermove', event => {
        if (!finePointer.matches || reduceMotion.matches) return;
        const bounds = effectHost.getBoundingClientRect();
        pointer.x = event.clientX - bounds.left;
        pointer.y = event.clientY - bounds.top;
      }, { passive: true });
      effectHost.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1000; });
      document.addEventListener('visibilitychange', syncAnimation);
      reduceMotion.addEventListener('change', syncAnimation);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
          inView = entries[0].isIntersecting;
          syncAnimation();
        }).observe(effectHost);
      }
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(effectHost);
      else window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
      window.addEventListener('pageshow', syncAnimation);
      resize();
    }
  }
  }

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
  // Decorative failures must never prevent enquiry submission or navigation.
  try { initializeParticleLight(); }
  catch { document.querySelector('.particle-light canvas')?.remove(); }
})();
