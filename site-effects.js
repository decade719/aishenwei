/* Global atmosphere: one viewport-sized canvas, independent of business interactions. */
(() => {
  if (!document.body.matches('.company-page, .partner-profile-page')) return;
  const atmosphere = document.createElement('div');
  atmosphere.className = 'site-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  const aurora = document.createElement('div');
  aurora.className = 'site-aurora';
  atmosphere.append(aurora, canvas);
  document.body.prepend(atmosphere);

  try {
    const context = canvas.getContext('2d');
    if (!context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const precise = matchMedia('(pointer: fine)');
    const saver = navigator.connection?.saveData === true;
    const pointer = { x: -1000, y: -1000 };
    let width = 0, height = 0, points = [], frame = 0, lastPaint = 0;
    let dark = document.documentElement.dataset.companyTheme !== 'light';
    let scrollPosition = window.scrollY;
    let interval = 1000 / 30;

    function paint(time = 0, advance = false) {
      context.clearRect(0, 0, width, height);
      const elapsed = advance ? Math.min((time - lastPaint) / 33.33 || 1, 2) : 0;
      lastPaint = time;
      const cyan = dark ? '97,229,231' : '5,117,142';
      const blue = dark ? '110,159,255' : '38,90,190';
      const reach = width < 640 ? 106 : 158;
      const drift = reduced.matches ? 0 : scrollPosition * .018;
      const positions = points.map(point => {
        point.x += point.vx * elapsed;
        point.y += point.vy * elapsed;
        if (point.x < -20) point.x = width + 20;
        if (point.x > width + 20) point.x = -20;
        if (point.y < -20) point.y = height + 20;
        if (point.y > height + 20) point.y = -20;
        return { x: point.x, y: ((point.y - drift) % height + height) % height };
      });
      positions.forEach((point, index) => {
        const color = index % 3 ? cyan : blue;
        const alpha = reduced.matches ? .65 : .5 + Math.sin(time / 1500 + index) * .2;
        context.fillStyle = `rgba(${color},${alpha * (dark ? .85 : .48)})`;
        context.beginPath();
        context.arc(point.x, point.y, points[index].size, 0, Math.PI * 2);
        context.fill();
        if (index % 7 === 0) {
          const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, 14);
          glow.addColorStop(0, `rgba(${color},${dark ? .24 : .08})`);
          glow.addColorStop(1, `rgba(${color},0)`);
          context.fillStyle = glow;
          context.fillRect(point.x - 14, point.y - 14, 28, 28);
        }
        for (let target = index + 1; target < positions.length; target++) {
          const next = positions[target];
          const distance = Math.hypot(point.x - next.x, point.y - next.y);
          if (distance >= reach) continue;
          context.strokeStyle = `rgba(${color},${(1 - distance / reach) * (dark ? .24 : .11)})`;
          context.lineWidth = .65;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(next.x, next.y);
          context.stroke();
        }
        const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        if (precise.matches && !reduced.matches && distance < 170) {
          context.strokeStyle = `rgba(${cyan},${(1 - distance / 170) * .4})`;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(pointer.x, pointer.y);
          context.stroke();
        }
      });
      if (pointer.x > 0 && precise.matches && !reduced.matches) {
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220);
        glow.addColorStop(0, `rgba(${cyan},${dark ? .075 : .035})`);
        glow.addColorStop(1, `rgba(${cyan},0)`);
        context.fillStyle = glow;
        context.fillRect(pointer.x - 220, pointer.y - 220, 440, 440);
      }
    }
    function animate(time) {
      frame = requestAnimationFrame(animate);
      if (time - lastPaint >= interval) paint(time, true);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastPaint = 0;
      dark = document.documentElement.dataset.companyTheme !== 'light';
      atmosphere.classList.toggle('effects-paused', document.hidden || reduced.matches || saver);
      if (document.hidden) return;
      paint();
      if (!reduced.matches && !saver) frame = requestAnimationFrame(animate);
    }
    function resize() {
      width = Math.max(1, document.documentElement.clientWidth);
      height = Math.max(1, window.innerHeight);
      const mobile = width < 640;
      const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      interval = 1000 / (mobile ? 24 : 30);
      const count = mobile ? 24 : Math.min(88, Math.max(40, Math.round(width * height / 14500)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - .5) * .42, vy: (Math.random() - .5) * .3,
        size: .75 + Math.random() * 1.4
      }));
      sync();
    }
    document.addEventListener('pointermove', event => {
      if (!precise.matches || reduced.matches) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });
    document.addEventListener('pointerout', event => {
      if (!event.relatedTarget) pointer.x = pointer.y = -1000;
    });
    window.addEventListener('scroll', () => { scrollPosition = window.scrollY; }, { passive: true });
    let resizeFrame = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resize);
    }, { passive: true });
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-company-theme'] });
    window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); cancelAnimationFrame(resizeFrame); });
    window.addEventListener('pageshow', sync);
    resize();
  } catch {
    canvas.remove();
  }
})();
