import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import Twig from 'twig';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const delivery = pkg.name.includes('delivery');
const stem = delivery ? 'gift-delivery-module' : 'gift-package';
const source = readFileSync(`src/${stem}.js`, 'utf8');
const original = readFileSync(`src/${stem}.twig`, 'utf8');
const tick = () => new Promise((resolve) => setImmediate(resolve));

function render({ product = 42, configure = true, title } = {}) {
  let template = original;
  if (configure) {
    for (const [key, value] of Object.entries({
      standardGiftProductId: 101,
      premiumGiftProductId: 102,
      customizationGroupId: 1,
      deliveryDateFieldId: 2,
      giftMessageFieldId: 3,
    }))
      template = template.replace(`set ${key} = 0`, `set ${key} = ${value}`);
    template = template
      .replace(
        "set deliveryDateModule = 'off'",
        "set deliveryDateModule = 'on'",
      )
      .replace("set giftMessageModule = 'off'", "set giftMessageModule = 'on'");
  }
  if (title) template = template.replace('Standart hediye paketi', title);
  return Twig.twig({ data: template }).render({ product: { id: product } });
}

function setup({ adapter, configure = true, product = 42 } = {}) {
  const html = `${render({ configure, product })}
    <input class="native-customization" value="untouched" disabled>
    <a href="#cart" data-selector="add-to-cart" data-context="detail" data-product-id="${product}">Sepete ekle</a>`;
  const dom = new JSDOM(html, {
    url: 'https://store.example/product',
    runScripts: 'outside-only',
  });
  const { window } = dom;
  window.MidasGiftCartAdapter = adapter;
  window.eval(source);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  const document = window.document;
  const toggle = document.querySelector('[data-md-toggle]');
  const button = document.querySelector('[data-selector="add-to-cart"]');
  return {
    dom,
    window,
    document,
    toggle,
    button,
    enable() {
      toggle.checked = true;
      toggle.dispatchEvent(new window.Event('change', { bubbles: true }));
    },
    status() {
      return document.querySelector('[data-md-status]').textContent;
    },
  };
}

test('default template cannot activate unconfigured product IDs', () => {
  const app = setup({
    configure: false,
    adapter: { addMain() {}, addGift() {} },
  });
  assert.equal(app.toggle.disabled, true);
  app.dom.window.close();
});

test('gift product pages do not include a recursive gift module', () => {
  assert.equal(render({ product: 101 }).includes('data-md-gift'), false);
});

test('template escapes store text as plain content', () => {
  const html = render({ title: '<img src=x onerror=alert(1)>' });
  const dom = new JSDOM(html);
  assert.equal(dom.window.document.querySelector('[onerror]'), null);
  assert.equal(
    dom.window.document
      .querySelector('.md-gift__choice label')
      .textContent.trim(),
    '<img src=x onerror=alert(1)>',
  );
  assert.ok(html.includes('&lt;img'));
  dom.window.close();
});

test('missing adapter disables gifts and preserves the theme cart handler', () => {
  const app = setup();
  let native = 0;
  app.document.addEventListener('click', () => native++);
  app.button.click();
  assert.equal(app.toggle.disabled, true);
  assert.equal(native, 1);
  app.dom.window.close();
});

test('unchecked gift preserves normal cart behavior', () => {
  const app = setup({
    adapter: {
      addMain() {
        throw Error('must not run');
      },
      addGift() {},
    },
  });
  let native = 0;
  app.document.addEventListener('click', () => native++);
  app.button.click();
  assert.equal(native, 1);
  app.dom.window.close();
});

test('waits for explicit main success before adding gift, blocking duplicate theme handlers', async () => {
  let resolveMain,
    gifts = 0,
    mains = 0,
    native = 0;
  const app = setup({
    adapter: {
      addMain() {
        mains++;
        return new Promise((resolve) => {
          resolveMain = resolve;
        });
      },
      async addGift(item) {
        gifts++;
        assert.equal(item.productId, '101');
        assert.equal(item.quantity, 1);
        return { success: true };
      },
    },
  });
  app.document.addEventListener('click', () => native++);
  app.enable();
  app.button.click();
  app.button.click();
  assert.equal(mains, 1);
  assert.equal(gifts, 0);
  assert.equal(native, 0);
  resolveMain({ success: true });
  await tick();
  assert.equal(gifts, 1);
  assert.ok(app.status().includes('sepete eklendi'));
  assert.equal(app.button.hasAttribute('aria-busy'), false);
  app.dom.window.close();
});

for (const outcome of ['reject', 'false', 'undefined']) {
  test(`does not add gift when main result is ${outcome}`, async () => {
    let gifts = 0;
    const app = setup({
      adapter: {
        async addMain() {
          if (outcome === 'reject') throw Error('out of stock');
          return outcome === 'false' ? { success: false } : undefined;
        },
        async addGift() {
          gifts++;
          return { success: true };
        },
      },
    });
    app.enable();
    app.button.click();
    await tick();
    assert.equal(gifts, 0);
    assert.ok(app.status().includes('kontrol edin'));
    assert.equal(app.toggle.disabled, false);
    app.dom.window.close();
  });
}

test('partial success blocks automatic resubmission of the main item', async () => {
  let mains = 0,
    gifts = 0;
  const app = setup({
    adapter: {
      async addMain() {
        mains++;
        return { success: true };
      },
      async addGift() {
        gifts++;
        throw Error('network');
      },
    },
  });
  app.enable();
  app.button.click();
  await tick();
  assert.ok(app.status().includes('Ürün sepete eklendi'));
  app.button.click();
  await tick();
  assert.equal(mains, 1);
  assert.equal(gifts, 1);
  assert.equal(app.toggle.disabled, true);
  app.dom.window.close();
});

test('does not intercept another product button', () => {
  const app = setup({
    adapter: {
      addMain() {
        throw Error('wrong product');
      },
      addGift() {},
    },
  });
  app.enable();
  app.button.dataset.productId = '999';
  const event = new app.window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  });
  app.button.dispatchEvent(event);
  assert.equal(event.defaultPrevented, false);
  app.dom.window.close();
});

test('duplicate script loading does not create duplicate purchases', async () => {
  let mains = 0;
  const app = setup({
    adapter: {
      async addMain() {
        mains++;
        return { success: true };
      },
      async addGift() {
        return { success: true };
      },
    },
  });
  app.window.eval(source);
  app.enable();
  app.button.click();
  await tick();
  assert.equal(mains, 1);
  app.dom.window.close();
});

if (delivery) {
  test('customizations accompany only main product and never mutate native fields', async () => {
    let main, gift;
    const app = setup({
      adapter: {
        async addMain(item) {
          main = item;
          return { success: true };
        },
        async addGift(item) {
          gift = item;
          return { success: true };
        },
      },
    });
    app.enable();
    const note = app.document.querySelector('textarea');
    note.value = 'Mutlu yıllar <3';
    const date = app.document.querySelector('input[type="date"]');
    date.value = '2099-12-20';
    app.button.click();
    await tick();
    assert.equal(main.customization.fields.length, 2);
    assert.equal(main.customization.fields[1].value, 'Mutlu yıllar <3');
    assert.equal(gift.customization, undefined);
    assert.equal(
      app.document.querySelector('.native-customization').value,
      'untouched',
    );
    assert.equal(
      app.document.querySelector('.native-customization').disabled,
      true,
    );
    app.dom.window.close();
  });

  test('switching gifts off clears module values without touching native fields', () => {
    const app = setup({ adapter: { addMain() {}, addGift() {} } });
    app.enable();
    const note = app.document.querySelector('textarea');
    note.value = 'discard';
    app.toggle.checked = false;
    app.toggle.dispatchEvent(new app.window.Event('change', { bubbles: true }));
    assert.equal(note.value, '');
    assert.equal(note.disabled, true);
    app.dom.window.close();
  });

  for (const invalid of ['past-date', 'long-note']) {
    test(`rejects invalid customization: ${invalid}`, async () => {
      let mains = 0;
      const app = setup({
        adapter: {
          async addMain() {
            mains++;
            return { success: true };
          },
          addGift() {},
        },
      });
      app.enable();
      if (invalid === 'past-date')
        app.document.querySelector('input[type="date"]').value = '2000-01-01';
      else app.document.querySelector('textarea').value = 'x'.repeat(251);
      app.button.click();
      await tick();
      assert.equal(mains, 0);
      assert.ok(app.status().includes('kontrol edin'));
      app.dom.window.close();
    });
  }
}

test('rejects synchronous success that cannot represent an awaited server result', async () => {
  let gifts = 0;
  const app = setup({
    adapter: {
      addMain() {
        return { success: true };
      },
      async addGift() {
        gifts++;
        return { success: true };
      },
    },
  });
  app.enable();
  app.button.click();
  await tick();
  assert.equal(gifts, 0);
  assert.ok(app.status().includes('kontrol edin'));
  app.dom.window.close();
});

test('ambiguous duplicate snippets block a gift transaction', async () => {
  let mains = 0;
  const app = setup({
    adapter: {
      async addMain() {
        mains++;
        return { success: true };
      },
      addGift() {},
    },
  });
  app.enable();
  app.document
    .querySelector('[data-md-gift]')
    .after(app.document.querySelector('[data-md-gift]').cloneNode(true));
  app.button.click();
  await tick();
  assert.equal(mains, 0);
  assert.ok(app.status().includes('kullanılamıyor'));
  app.dom.window.close();
});

test('configured media and links reject script protocols before DOM activation', () => {
  const app = setup();
  const module = app.document.querySelector('[data-md-gift]');
  const clone = module.cloneNode(true);
  clone.dataset.productId = '999';
  const image = clone.querySelector('[data-md-image]');
  image.dataset.mdImage = 'javascript:alert(1)';
  const link = clone.querySelector('[data-md-url]');
  link.dataset.mdUrl = 'javascript:alert(1)';
  module.after(clone);
  app.document.dispatchEvent(new app.window.Event('midas:gift:refresh'));
  assert.equal(image.hasAttribute('src'), false);
  assert.equal(link.hasAttribute('href'), false);
  assert.equal(image.hidden, true);
  assert.equal(link.hidden, true);
  app.dom.window.close();
});
