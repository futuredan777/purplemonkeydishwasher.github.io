/**
 * CMS — UI Utilities
 * Toast, dialog, dropdowns, theme toggle, event helpers.
 */

// ---- Icons (inline SVG strings) ----------------------------------------

const Icons = {
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 18 4 13"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

// ---- Toast --------------------------------------------------------------

const Toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function show(message, { title, type = 'default', duration = 4000 } = {}) {
    const c = getContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;

    let iconHtml = '';
    if (type === 'success') iconHtml = `<span class="toast-icon">${Icons.check}</span>`;
    else if (type === 'error') iconHtml = `<span class="toast-icon">${Icons.x}</span>`;
    else if (type === 'warning') iconHtml = `<span class="toast-icon">${Icons.alert}</span>`;

    el.innerHTML = `
      ${iconHtml}
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">${Icons.x}</button>
    `;

    el.querySelector('.toast-close').addEventListener('click', () => dismiss(el));
    c.appendChild(el);

    if (duration > 0) {
      setTimeout(() => dismiss(el), duration);
    }
    return el;
  }

  function dismiss(el) {
    if (!el.parentNode) return;
    el.classList.add('dismissing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  return {
    show,
    success: (msg, opts) => show(msg, { type: 'success', ...opts }),
    error:   (msg, opts) => show(msg, { type: 'error',   ...opts }),
    warning: (msg, opts) => show(msg, { type: 'warning', ...opts }),
  };
})();

window.Toast = Toast;

// ---- Dialog -------------------------------------------------------------

const Dialog = (() => {
  function show({ title, description, body, actions, onClose, size = 'md' } = {}) {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';

    const maxW = size === 'lg' ? '42rem' : size === 'sm' ? '20rem' : '28rem';
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.style.maxWidth = maxW;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    dialog.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title">${title || ''}</div>
        ${description ? `<div class="dialog-description">${description}</div>` : ''}
      </div>
      ${body ? `<div class="dialog-body">${body}</div>` : ''}
      ${actions ? `<div class="dialog-footer">${actions}</div>` : ''}
    `;

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    function close(result) {
      backdrop.remove();
      onClose && onClose(result);
    }

    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(null); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(null); document.removeEventListener('keydown', esc); }
    });

    // Wire action buttons
    dialog.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => close(btn.dataset.action));
    });

    return { backdrop, dialog, close };
  }

  function confirm({ title, description, confirmText = 'Confirm', cancelText = 'Cancel', destructive = false } = {}) {
    return new Promise(resolve => {
      show({
        title,
        description,
        actions: `
          <button class="btn btn-outline" data-action="cancel">${cancelText}</button>
          <button class="btn ${destructive ? 'btn-destructive' : 'btn-primary'}" data-action="confirm">${confirmText}</button>
        `,
        onClose: result => resolve(result === 'confirm'),
      });
    });
  }

  return { show, confirm };
})();

window.Dialog = Dialog;

// ---- Theme --------------------------------------------------------------

const Theme = (() => {
  function get() {
    return localStorage.getItem('cms_theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function set(theme) {
    localStorage.setItem('cms_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.innerHTML = theme === 'dark' ? sunIcon() : moonIcon();
    });
  }
  function toggle() { set(get() === 'dark' ? 'light' : 'dark'); }
  function init()   { set(get()); }

  function moonIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
  function sunIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }

  return { get, set, toggle, init };
})();

window.Theme = Theme;

// ---- Dropdown -----------------------------------------------------------

function initDropdowns() {
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-dropdown-trigger]');
    const openMenus = document.querySelectorAll('.dropdown-menu.open');

    if (trigger) {
      const menuId = trigger.dataset.dropdownTrigger;
      const menu = document.getElementById(menuId) || trigger.nextElementSibling;
      const isOpen = menu && menu.classList.contains('open');
      openMenus.forEach(m => { if (m !== menu) m.classList.remove('open'); });
      if (menu) menu.classList.toggle('open', !isOpen);
      e.stopPropagation();
    } else {
      openMenus.forEach(m => m.classList.remove('open'));
    }
  });
}

// ---- Tabs ---------------------------------------------------------------

function initTabs(container) {
  const root = typeof container === 'string'
    ? document.querySelector(container)
    : (container || document);

  root.querySelectorAll('.tabs-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const tabId = trigger.dataset.tab;
      const tabsEl = trigger.closest('.tabs');
      if (!tabsEl) return;
      tabsEl.querySelectorAll('.tabs-trigger').forEach(t => t.classList.remove('active'));
      tabsEl.querySelectorAll('.tabs-content').forEach(c => c.classList.remove('active'));
      trigger.classList.add('active');
      const content = tabsEl.querySelector(`[data-tab-content="${tabId}"]`);
      if (content) content.classList.add('active');
    });
  });
}

// ---- Helpers ------------------------------------------------------------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function wordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function charCount(html) {
  return html.replace(/<[^>]+>/g, '').length;
}

window.initDropdowns = initDropdowns;
window.initTabs = initTabs;
window.escapeHtml = escapeHtml;
window.debounce = debounce;
window.wordCount = wordCount;
window.charCount = charCount;
