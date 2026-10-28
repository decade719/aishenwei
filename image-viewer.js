/* One image viewer for public pages; large sources load only when requested. */
(() => {
  if (document.querySelector('.image-viewer')) return;
  const main = document.querySelector('main');
  if (!main) return;
  const english = () => document.documentElement.lang === 'en';
  const text = (zh, en) => english() ? en : zh;
  const items = [];
  const enlargeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></svg>';

  main.querySelectorAll('img').forEach(image => {
    // Navigation logos and member-directory links retain their original purpose.
    if (image.closest('.company-brand, .brand-lockup-visual, .person-card') || image.getAttribute('aria-hidden') === 'true') return;
    const link = image.closest('a[href]');
    const imageLink = link && /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(link.getAttribute('href'));
    const item = { image, source: image.dataset.fullSrc || (imageLink ? link.getAttribute('href') : image.getAttribute('src')), label: image.alt };
    if (!item.source) return;
    items.push(item);
    if (imageLink) {
      item.trigger = link;
      link.addEventListener('click', event => { event.preventDefault(); open(item); });
    } else if (link) {
      // Keep card navigation, with a separate accessible preview control outside the link.
      let wrapper = link.parentElement;
      if (!wrapper.classList.contains('image-preview-card')) {
        wrapper = document.createElement('div');
        wrapper.className = 'image-preview-card';
        link.before(wrapper);
        wrapper.append(link);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'image-preview-button';
      button.innerHTML = enlargeIcon;
      button.setAttribute('aria-label', text('放大图片：', 'Enlarge image: ') + image.alt);
      button.setAttribute('aria-haspopup', 'dialog');
      wrapper.append(button);
      item.trigger = button;
      button.addEventListener('click', () => open(item));
      image.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); open(item); });
      image.classList.add('image-preview-target');
    } else {
      item.trigger = image;
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-haspopup', 'dialog');
      image.setAttribute('aria-label', text('放大图片：', 'Enlarge image: ') + image.alt);
      image.classList.add('image-preview-target');
      image.addEventListener('click', () => open(item));
      image.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(item); }
      });
    }
  });

  const brand = main.querySelector('.brand-lockup-visual');
  if (brand) {
    const item = { brand, label: '深维智能科技（镇江）有限公司', trigger: brand };
    items.push(item);
    brand.tabIndex = 0;
    brand.setAttribute('role', 'button');
    brand.setAttribute('aria-haspopup', 'dialog');
    brand.setAttribute('aria-label', text('放大公司标志', 'Enlarge company logo'));
    brand.classList.add('image-preview-target');
    brand.addEventListener('click', () => open(item));
    brand.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(item); }
    });
  }
  if (!items.length) return;

  const viewer = document.createElement('div');
  viewer.className = 'image-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.innerHTML = '<div class="image-viewer-toolbar"><span class="image-viewer-count" aria-live="polite"></span><div class="image-viewer-controls"><button type="button" data-viewer-action="previous">←</button><button type="button" data-viewer-action="next">→</button><button type="button" data-viewer-action="zoom" aria-pressed="false">+</button><button type="button" data-viewer-action="close" class="image-viewer-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg><span></span></button></div></div><div class="image-viewer-stage"><img class="image-viewer-image" alt="" decoding="async"><div class="image-viewer-brand" hidden></div></div><p class="image-viewer-status" role="status"></p>';
  document.body.append(viewer);
  const stage = viewer.querySelector('.image-viewer-stage');
  const photo = viewer.querySelector('.image-viewer-image');
  const brandStage = viewer.querySelector('.image-viewer-brand');
  const status = viewer.querySelector('.image-viewer-status');
  const counter = viewer.querySelector('.image-viewer-count');
  const buttons = Object.fromEntries([...viewer.querySelectorAll('[data-viewer-action]')].map(button => [button.dataset.viewerAction, button]));
  let active = 0, opened = false, zoomed = false, waitingForBack = false, token, previousFocus, savedScroll, inertElements = [];

  function sizeImage() {
    if (!opened) return;
    const width = Math.max(1, stage.clientWidth - 40), height = Math.max(1, stage.clientHeight - 40);
    if (items[active].brand) {
      brandStage.style.width = `${Math.min(width, height * 1.2)}px`;
      return;
    }
    if (!photo.naturalWidth) return;
    const scale = Math.min(width / photo.naturalWidth, height / photo.naturalHeight) * (zoomed ? 2 : 1);
    photo.style.width = `${Math.round(photo.naturalWidth * scale)}px`;
    photo.style.height = `${Math.round(photo.naturalHeight * scale)}px`;
  }
  function show() {
    const item = items[active];
    zoomed = false;
    buttons.zoom.setAttribute('aria-pressed', 'false');
    buttons.zoom.textContent = '+';
    buttons.zoom.disabled = Boolean(item.brand);
    buttons.zoom.setAttribute('aria-label', text('继续放大', 'Zoom in'));
    buttons.previous.setAttribute('aria-label', text('上一张图片', 'Previous image'));
    buttons.next.setAttribute('aria-label', text('下一张图片', 'Next image'));
    buttons.close.setAttribute('aria-label', text('关闭图片预览', 'Close image preview'));
    buttons.close.querySelector('span').textContent = text('关闭', 'Close');
    viewer.setAttribute('aria-label', text('图片预览', 'Image preview'));
    counter.textContent = `${active + 1} / ${items.length}`;
    buttons.previous.disabled = buttons.next.disabled = items.length < 2;
    stage.scrollTop = stage.scrollLeft = 0;
    brandStage.replaceChildren();
    brandStage.hidden = !item.brand;
    photo.hidden = Boolean(item.brand);
    if (item.brand) {
      const copy = item.brand.cloneNode(true);
      copy.removeAttribute('tabindex'); copy.removeAttribute('role'); copy.removeAttribute('aria-haspopup'); copy.removeAttribute('aria-label');
      copy.classList.remove('image-preview-target');
      brandStage.append(copy);
      photo.removeAttribute('src');
      status.textContent = '';
      viewer.setAttribute('aria-busy', 'false');
      sizeImage();
    } else {
      viewer.setAttribute('aria-busy', 'true');
      status.textContent = text('正在加载图片…', 'Loading image…');
      photo.style.width = photo.style.height = '';
      photo.alt = item.label || text('图片', 'Image');
      photo.src = item.source;
    }
  }
  function open(item) {
    if (opened || waitingForBack) return;
    opened = true;
    active = items.indexOf(item);
    previousFocus = item.trigger;
    savedScroll = { x: window.scrollX, y: window.scrollY };
    // Save the real document position before fixing the body for the overlay.
    token = `image-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { history.pushState({ ...history.state, imageViewer: token }, ''); } catch { token = null; }
    document.documentElement.style.setProperty('--image-viewer-scroll', `-${savedScroll.y}px`);
    document.documentElement.classList.add('image-viewer-open');
    inertElements = [...document.body.children].filter(element => element !== viewer && !element.inert);
    inertElements.forEach(element => { element.inert = true; });
    viewer.hidden = false;
    show();
    buttons.close.focus({ preventScroll: true });
  }
  function close(fromHistory = false) {
    if (!opened) return;
    opened = false;
    viewer.hidden = true;
    photo.removeAttribute('src');
    brandStage.replaceChildren();
    inertElements.forEach(element => { element.inert = false; });
    inertElements = [];
    document.documentElement.classList.remove('image-viewer-open');
    document.documentElement.style.removeProperty('--image-viewer-scroll');
    const behavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(savedScroll.x, savedScroll.y);
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    document.documentElement.style.scrollBehavior = behavior;
    if (!fromHistory && token && history.state?.imageViewer === token) {
      waitingForBack = true;
      history.back();
    }
    token = null;
  }
  function step(offset) { active = (active + offset + items.length) % items.length; show(); }
  photo.addEventListener('load', () => {
    if (!opened) return;
    status.textContent = '';
    viewer.setAttribute('aria-busy', 'false');
    sizeImage();
  });
  photo.addEventListener('error', () => {
    if (opened && !photo.hidden && photo.hasAttribute('src')) {
      status.textContent = text('图片暂时无法加载，请关闭后重试。', 'The image could not be loaded. Please close and try again.');
      viewer.setAttribute('aria-busy', 'false');
    }
  });
  buttons.close.addEventListener('click', () => close());
  buttons.previous.addEventListener('click', () => step(-1));
  buttons.next.addEventListener('click', () => step(1));
  buttons.zoom.addEventListener('click', () => {
    zoomed = !zoomed;
    buttons.zoom.setAttribute('aria-pressed', String(zoomed));
    buttons.zoom.setAttribute('aria-label', zoomed ? text('恢复适合窗口', 'Fit image to window') : text('继续放大', 'Zoom in'));
    buttons.zoom.textContent = zoomed ? '−' : '+';
    sizeImage();
  });
  viewer.addEventListener('click', event => { if (event.target === viewer || event.target === stage) close(); });
  document.addEventListener('keydown', event => {
    if (!opened) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'Tab') {
      const controls = [...viewer.querySelectorAll('button:not(:disabled)')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !viewer.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !viewer.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('popstate', () => { waitingForBack = false; if (opened) close(true); });
  window.addEventListener('resize', sizeImage);
})();
