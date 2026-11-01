import { addItem, emptyCart } from '../cart/cartLogic.js';

// GET /orders/:id/reorder-preview -> a ready cart (lines the shop can still serve, quantities
// already reduced to the stock that is left) plus a summary of what changed.
export function buildReorderCart(preview) {
  let cart = emptyCart();
  const summary = { added: 0, reduced: 0, unavailable: 0 };
  const supplier = { id: preview.supplierId, shopName: preview.supplierName };
  for (const item of preview.items ?? []) {
    if (item.adjustment === 'unavailable' || !(item.quantity > 0)) {
      summary.unavailable += 1;
      continue;
    }
    const out = addItem(cart, {
      product: {
        id: item.productId, name: item.name, price: item.price, imageUrl: item.imageUrl,
        requiresAdvanceOrder: item.requiresAdvanceOrder, supplierId: item.supplierId ?? preview.supplierId, stock: null,
      },
      supplier,
      quantity: item.quantity,
      customization: item.customization ?? '',
    });
    cart = out.cart;
    summary.added += 1;
    if (item.adjustment === 'quantity_reduced') summary.reduced += 1;
  }
  return { cart, summary, canReorder: !!preview.canReorder && cart.items.length > 0 };
}
