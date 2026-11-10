export const MAX_QUANTITY = 99;
export const MAX_CUSTOMIZATION = 500;

export const emptyCart = () => ({
  supplierId: null,
  supplierName: null,
  items: [],
});

const cleanNote = (value) =>
  String(value ?? "")
    .trim()
    .slice(0, MAX_CUSTOMIZATION);
export const itemKey = (productId, customization) =>
  `${productId}::${cleanNote(customization)}`;

const clampQuantity = (quantity, stock) => {
  const q = Math.floor(Number(quantity));
  if (!Number.isFinite(q) || q < 1) return 1;
  const cap =
    Number.isFinite(Number(stock)) && stock !== null
      ? Math.max(1, Math.min(MAX_QUANTITY, Math.floor(stock)))
      : MAX_QUANTITY;
  return Math.min(q, cap);
};

export function addItem(
  cart,
  { product, supplier, quantity = 1, customization = "" },
) {
  const supplierId = product.supplierId ?? supplier?.id;
  if (!supplierId) return { cart, conflict: false, error: "missing_supplier" };
  if (cart.items.length > 0 && cart.supplierId !== supplierId)
    return { cart, conflict: true };

  const key = itemKey(product.id, customization);
  const existing = cart.items.find((i) => i.key === key);
  const next = existing
    ? cart.items.map((i) =>
        i.key === key
          ? {
              ...i,
              quantity: clampQuantity(i.quantity + quantity, i.stock),
              stock: product.stock ?? i.stock,
            }
          : i,
      )
    : [
        ...cart.items,
        {
          key,
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl ?? null,
          category: product.category ?? null,
          stock: product.stock ?? null,
          requiresAdvanceOrder: !!product.requiresAdvanceOrder,
          customization: cleanNote(customization),
          quantity: clampQuantity(quantity, product.stock),
        },
      ];
  return {
    cart: {
      supplierId,
      supplierName:
        supplier?.shopName ?? product.supplier?.shopName ?? cart.supplierName,
      items: next,
    },
    conflict: false,
  };
}

export function replaceWith(cart, args) {
  return addItem(emptyCart(), args);
}

export function setQuantity(cart, key, quantity) {
  const q = Math.floor(Number(quantity));
  if (!Number.isFinite(q) || q < 1) return removeItem(cart, key);
  const items = cart.items.map((i) =>
    i.key === key ? { ...i, quantity: clampQuantity(q, i.stock) } : i,
  );
  return { ...cart, items };
}

export function removeItem(cart, key) {
  const items = cart.items.filter((i) => i.key !== key);
  return items.length ? { ...cart, items } : emptyCart();
}

export function setCustomization(cart, key, customization) {
  const note = cleanNote(customization);
  const newKey = itemKey(
    cart.items.find((i) => i.key === key)?.productId,
    note,
  );
  const target = cart.items.find((i) => i.key === key);
  if (!target) return cart;
  const merged = cart.items.find((i) => i.key === newKey && i.key !== key);
  if (merged) {
    const items = cart.items
      .filter((i) => i.key !== key)
      .map((i) =>
        i.key === newKey
          ? {
              ...i,
              quantity: clampQuantity(i.quantity + target.quantity, i.stock),
            }
          : i,
      );
    return { ...cart, items };
  }
  return {
    ...cart,
    items: cart.items.map((i) =>
      i.key === key ? { ...i, key: newKey, customization: note } : i,
    ),
  };
}

export const cartCount = (cart) =>
  cart.items.reduce((n, i) => n + i.quantity, 0);

export const cartSubtotal = (cart) =>
  cart.items.reduce(
    (sum, i) => sum + Math.round(i.price * 100) * i.quantity,
    0,
  ) / 100;

export const hasPreorderItems = (cart) =>
  cart.items.some((i) => i.requiresAdvanceOrder);

export function stockProblems(cart) {
  return cart.items
    .filter(
      (i) =>
        Number.isFinite(Number(i.stock)) &&
        i.stock !== null &&
        i.quantity > i.stock,
    )
    .map((i) => i.key);
}

export const toOrderItems = (cart) =>
  cart.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    ...(i.customization ? { customization: i.customization } : {}),
  }));

export function sanitizeStoredCart(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items))
    return emptyCart();
  const items = [];
  for (const i of raw.items) {
    if (!i || typeof i.productId !== "string" || typeof i.name !== "string")
      continue;
    const price = Number(i.price);
    if (!Number.isFinite(price) || price < 0) continue;
    const stock =
      i.stock === null ||
      i.stock === undefined ||
      !Number.isFinite(Number(i.stock))
        ? null
        : Math.max(0, Math.floor(Number(i.stock)));
    const note = cleanNote(i.customization);
    items.push({
      key: itemKey(i.productId, note),
      productId: i.productId,
      name: i.name.slice(0, 200),
      price,
      imageUrl: typeof i.imageUrl === "string" ? i.imageUrl : null,
      category: typeof i.category === "string" ? i.category : null,
      stock,
      requiresAdvanceOrder: !!i.requiresAdvanceOrder,
      customization: note,
      quantity: clampQuantity(i.quantity, stock),
    });
  }
  const merged = [];
  for (const it of items) {
    const dup = merged.find((m) => m.key === it.key);
    if (dup)
      dup.quantity = clampQuantity(dup.quantity + it.quantity, dup.stock);
    else merged.push(it);
  }
  if (!merged.length || typeof raw.supplierId !== "string") return emptyCart();
  return {
    supplierId: raw.supplierId,
    supplierName:
      typeof raw.supplierName === "string" ? raw.supplierName : null,
    items: merged,
  };
}
