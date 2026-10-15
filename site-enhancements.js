/* Progressive enhancements shared by the static pages. */
(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const closeNavigation = () => {
    nav?.setAttribute('data-open', 'false');
    toggle?.setAttribute('aria-expanded', 'false');
  };
  if (toggle && nav) {
    toggle.setAttribute('aria-label', '打开或关闭导航菜单');
    toggle.setAttribute('aria-expanded', 'false');
    nav.id ||= 'mainNav';
    toggle.setAttribute('aria-controls', nav.id);
    nav.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', closeNavigation));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.dataset.open === 'true') {
        closeNavigation();
        toggle.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) closeNavigation();
    });
  }

  // Native anchors replace wheel, touch and keyboard interception on legacy pages.
  document.querySelectorAll('.fp-section').forEach((section, index) => {
    section.id ||= section.dataset.anchor || `section-${index + 1}`;
  });
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.rel = 'noopener noreferrer';
  });
  document.querySelectorAll('div[onclick], article[onclick]').forEach(card => {
    if (card.querySelector('a, button, input, select, textarea')) return;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });
  });
  // Existing label elements often have no for attribute.
  document.querySelectorAll('form input, form select, form textarea').forEach((field, index) => {
    field.id ||= `form-field-${index}`;
    const label = field.previousElementSibling;
    if (label?.tagName === 'LABEL') label.htmlFor = field.id;
    if (field.name === 'email') field.autocomplete = 'email';
    if (field.name === 'phone') { field.autocomplete = 'tel'; field.inputMode = 'tel'; }
    if (field.name === 'name') field.autocomplete = 'name';
  });

  // Focus stays in the product announcement dialog and returns to its trigger.
  document.querySelectorAll('#customModal, #orderModal').forEach(dialog => {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const title = dialog.querySelector('h2, h3');
    if (title) { title.id ||= `${dialog.id}-title`; dialog.setAttribute('aria-labelledby', title.id); }
    let previousFocus;
    let wasOpen = false;
    new MutationObserver(() => {
      const open = dialog.style.display !== 'none';
      document.body.classList.toggle('dialog-open', open);
      if (open && !wasOpen) {
        previousFocus = document.activeElement;
        dialog.querySelector('button')?.focus();
      } else if (!open && wasOpen) previousFocus?.focus();
      wasOpen = open;
    }).observe(dialog, { attributes: true, attributeFilter: ['style'] });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        const controls = [...dialog.querySelectorAll('button, a[href], input, select, textarea')];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
  });
})();
