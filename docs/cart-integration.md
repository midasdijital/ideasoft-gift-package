# Store-specific cart integration

This document does not define an IdeaSoft API endpoint. Connect cart code verified for your theme/version to this contract. `button.click()` or a fixed delay does not prove success.

## Contract

Define `window.MidasGiftCartAdapter` before loading the module:

```ts
interface CartAdapter {
  addMain(input: {
    button: HTMLElement;
    customization: null | {
      groupId: string;
      fields: Array<{ fieldId: string; value: string }>;
    };
  }): Promise<{ success: true }>;
  addGift(input: {
    productId: string;
    quantity: 1;
  }): Promise<{ success: true }>;
}
```

`addMain` adds the main product represented by the button while preserving the selected variant, quantity, and other existing customizations. It must map the supplied gift customizations to the correct group/field structure on the **main product** and submit them once. It must not disable unrelated browser fields in bulk. The module does not implement this mapping for the integration.

`addGift` adds exactly one unit of the specified gift packaging product. It must not copy the main product's customization or variant. Each method must return `{ success: true }` only after verifying the server's business result. HTTP 200 alone is insufficient: handle validation, stock, and variant errors too. Reject or return `{ success: false }` on failure. `undefined`, an early return without a Promise, and unconditional success are unsupported.

The following scaffold can be used in an integration test; it **does not add products to a cart**. Do not deploy it to a live store:

```javascript
window.MidasGiftCartAdapter = {
  async addMain({ button, customization }) {
    // Run the verified theme request and check the business result here.
    // Read variant/quantity context from button and gift fields from customization.
    throw new Error('Store addMain integration has not been implemented');
  },
  async addGift({ productId, quantity }) {
    // Run the verified request that adds only the gift packaging product here.
    throw new Error('Store addGift integration has not been implemented');
  },
};
```

The listener applies only to module/button pairs with the same `data-product-id`. When gifting is disabled, the normal theme flow is preserved. After adding a module dynamically to the DOM, call `document.dispatchEvent(new Event('midas:gift:refresh'))`. The adapter must be ready at page initialization; reload the page to apply later configuration changes.

## Success, failure, and retries

Gift packaging is not added until the main product is confirmed. A second click from the same module is blocked while the operation is pending. On success, the user is told that both additions were confirmed.

If the main product succeeds but gift packaging fails, the module neither retries automatically nor removes the main product. It blocks further main-product additions from that module until the page is reloaded and asks the user to check the cart. A network error does not prove that the operation failed on the server. Users should check their cart before retrying. Reloading clears the lock; the cart must be checked before reloading.

These two requests are not a database transaction. Add idempotency and line-item association if the server supports them. The module does not provide cart-line removal, rollback, checkout completion, or a delivery guarantee. If an integration Promise never settles, the module remains pending; the adapter must handle network timeouts and uncertain results. The module does not guess automatic timeout/resubmission behavior because it could cause duplicate charges.

The server must independently validate IDs, prices, stock, length limits, field/group assignments, variants, and permissions. A product ID in the DOM is not a security boundary. Preserve the existing IdeaSoft session and CSRF mechanisms in requests; never expose secret keys to the browser.
