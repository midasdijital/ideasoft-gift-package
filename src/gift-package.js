/** Midas Dijital gift cart integration. MIT License. */
(function () {
  'use strict';

  if (window.MidasGiftCartInstalled) return;
  window.MidasGiftCartInstalled = true;

  const states = new WeakMap();
  const positiveId = (value) => /^[1-9]\d*$/.test(String(value || ''));
  const adapterReady = (adapter) =>
    adapter &&
    typeof adapter.addMain === 'function' &&
    typeof adapter.addGift === 'function';

  function message(module, text) {
    module.querySelector('[data-md-status]').textContent = text;
  }

  function controls(module) {
    return Array.from(module.querySelectorAll('input, textarea, select'));
  }

  function sync(module) {
    const state = states.get(module);
    if (!state || state.pending || state.partial) return;
    const toggle = module.querySelector('[data-md-toggle]');
    const ready =
      adapterReady(window.MidasGiftCartAdapter) &&
      positiveId(module.dataset.productId) &&
      Array.from(module.querySelectorAll('[data-md-option]')).some((input) =>
        positiveId(input.value),
      );
    toggle.disabled = !ready;
    if (!ready) toggle.checked = false;
    const enabled = ready && toggle.checked;
    toggle.setAttribute('aria-expanded', String(enabled));
    module.querySelector('[data-md-options]').hidden = !enabled;
    module
      .querySelectorAll('[data-md-option], [data-md-field]')
      .forEach((field) => {
        field.disabled =
          !enabled ||
          (field.matches('[data-md-option]') && !positiveId(field.value));
      });
    if (!enabled) {
      module.querySelectorAll('[data-md-field]').forEach((field) => {
        field.value = '';
      });
    }
    const count = module.querySelector('[data-md-count]');
    const note = module.querySelector('textarea[data-md-field]');
    if (count && note) count.textContent = String(note.value.length);
    message(module, ready ? '' : 'Hediye paketi şu anda kullanılamıyor.');
  }

  function safeAssetUrl(value) {
    if (!value || /[\u0000-\u0020\u007f]/.test(value)) return null;
    try {
      const url = new URL(value, window.location.origin);
      if (
        !['https:', 'http:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        return null;
      if (window.location.protocol === 'https:' && url.protocol !== 'https:')
        return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function initialize() {
    document.querySelectorAll('[data-md-gift]').forEach((module) => {
      if (states.has(module)) return;
      states.set(module, { pending: false, partial: false });
      module
        .querySelectorAll('[data-md-url], [data-md-image]')
        .forEach((node) => {
          const image = node.hasAttribute('data-md-image');
          const url = safeAssetUrl(
            image ? node.dataset.mdImage : node.dataset.mdUrl,
          );
          if (!url) return;
          if (image) {
            node.src = url;
            node.referrerPolicy = 'no-referrer';
            node.addEventListener(
              'error',
              () => {
                node.hidden = true;
              },
              { once: true },
            );
          } else node.href = url;
          node.hidden = false;
        });
      const date = module.querySelector('input[type="date"]');
      if (date) {
        const today = new Date();
        date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      sync(module);
    });
  }

  function snapshot(module) {
    const selected = module.querySelector(
      '[data-md-option]:checked:not(:disabled)',
    );
    if (!selected || !positiveId(selected.value)) throw new Error('selection');
    const fields = [];
    module.querySelectorAll('[data-md-field]').forEach((field) => {
      if (field.disabled || !field.value.trim()) return;
      const value = field.value.trim();
      if (
        !positiveId(field.dataset.fieldId) ||
        !positiveId(module.dataset.groupId)
      ) {
        throw new Error('configuration');
      }
      if (field.type === 'date') {
        const parsed = new Date(`${value}T00:00:00Z`);
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(parsed.valueOf()) ||
          parsed.toISOString().slice(0, 10) !== value ||
          value < field.min
        )
          throw new Error('date');
      }
      if (field.tagName === 'TEXTAREA' && value.length > 250)
        throw new Error('length');
      if (!field.checkValidity()) throw new Error('validity');
      fields.push({ fieldId: field.dataset.fieldId, value });
    });
    return {
      productId: selected.value,
      quantity: 1,
      customization: fields.length
        ? { groupId: module.dataset.groupId, fields }
        : null,
    };
  }

  async function purchase(module, button) {
    const state = states.get(module);
    const adapter = window.MidasGiftCartAdapter;
    if (!adapterReady(adapter)) {
      message(module, 'Hediye paketi şu anda kullanılamıyor.');
      return;
    }
    let gift;
    try {
      gift = snapshot(module);
    } catch {
      message(
        module,
        'Lütfen paket seçimini, teslim tarihini ve hediye notunu kontrol edin.',
      );
      return;
    }
    state.pending = true;
    const previous = controls(module).map((field) => [field, field.disabled]);
    previous.forEach(([field]) => {
      field.disabled = true;
    });
    const wasDisabled = button.disabled;
    const previousBusy = button.getAttribute('aria-busy');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    message(module, 'Ürünler sepete ekleniyor…');
    let mainAdded = false;
    try {
      const mainRequest = adapter.addMain({
        button,
        customization: gift.customization,
      });
      if (!mainRequest || typeof mainRequest.then !== 'function')
        throw new Error('async-main-required');
      const result = await mainRequest;
      if (!result || result.success !== true)
        throw new Error('main-not-confirmed');
      mainAdded = true;
      const giftRequest = adapter.addGift({
        productId: gift.productId,
        quantity: gift.quantity,
      });
      if (!giftRequest || typeof giftRequest.then !== 'function')
        throw new Error('async-gift-required');
      const giftResult = await giftRequest;
      if (!giftResult || giftResult.success !== true)
        throw new Error('gift-not-confirmed');
      message(module, 'Ürün ve hediye paketi sepete eklendi.');
    } catch {
      state.partial = mainAdded;
      message(
        module,
        mainAdded
          ? 'Ürün sepete eklendi; hediye paketi doğrulanamadı. Tekrar eklemeden önce sepetinizi kontrol edin.'
          : 'Sepete ekleme doğrulanamadı. Yeniden denemeden önce sepetinizi kontrol edin.',
      );
    } finally {
      state.pending = false;
      if (!state.partial)
        previous.forEach(([field, disabled]) => {
          field.disabled = disabled;
        });
      button.disabled = wasDisabled;
      if (previousBusy === null) button.removeAttribute('aria-busy');
      else button.setAttribute('aria-busy', previousBusy);
    }
  }

  document.addEventListener('change', (event) => {
    const module = event.target.closest('[data-md-gift]');
    if (module) sync(module);
  });
  document.addEventListener('input', (event) => {
    const module = event.target.closest('[data-md-gift]');
    const count = module && module.querySelector('[data-md-count]');
    if (count && event.target.matches('textarea[data-md-field]'))
      count.textContent = String(event.target.value.length);
  });
  document.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest(
        '[data-selector="add-to-cart"][data-context="detail"]',
      );
      if (!button) return;
      initialize();
      const modules = Array.from(
        document.querySelectorAll('[data-md-gift]'),
      ).filter(
        (module) => module.dataset.productId === button.dataset.productId,
      );
      if (modules.length !== 1) {
        if (
          modules.some(
            (module) => module.querySelector('[data-md-toggle]').checked,
          )
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          modules.forEach((module) =>
            message(module, 'Hediye paketi şu anda kullanılamıyor.'),
          );
        }
        return;
      }
      const module = modules[0];
      const state = states.get(module);
      if (
        !state.pending &&
        !state.partial &&
        !module.querySelector('[data-md-toggle]').checked
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (state.pending) return;
      if (state.partial) {
        message(
          module,
          'Ürün zaten eklendi. Devam etmeden önce sepetinizi kontrol edin.',
        );
        return;
      }
      void purchase(module, button);
    },
    true,
  );

  // Allows a theme to initialize snippets inserted after DOMContentLoaded.
  document.addEventListener('midas:gift:refresh', initialize);
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
