import { describe, it, expect } from 'vitest';
import {
  emptyCart, addItem, replaceWith, setQuantity, removeItem, setCustomization, cartCount, cartSubtotal,
  hasPreorderItems, stockProblems, toOrderItems, sanitizeStoredCart, itemKey, MAX_QUANTITY, MAX_CUSTOMIZATION,
} from '../src/features/cart/cartLogic.js';

const cake = { id: 'p1', name: 'Cake', price: 100, stock: 5, supplierId: 's1', category: 'Cakes', requiresAdvanceOrder: false };
const pie = { id: 'p2', name: 'Pie', price: 45.5, stock: null, supplierId: 's1', requiresAdvanceOrder: true };
const other = { id: 'p9', name: 'Donut', price: 10, stock: 3, supplierId: 's2' };
const shop1 = { id: 's1', shopName: 'Sweet Shop' };
const shop2 = { id: 's2', shopName: 'Other Shop' };
const add = (cart, product, extra = {}) => addItem(cart, { product, supplier: product.supplierId === 's2' ? shop2 : shop1, ...extra });

describe('addItem', () => {
  it('adds a line and remembers the supplier', () => {
    const { cart, conflict } = add(emptyCart(), cake, { quantity: 2 });
    expect(conflict).toBe(false);
    expect(cart.supplierId).toBe('s1');
    expect(cart.supplierName).toBe('Sweet Shop');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: 'p1', quantity: 2, price: 100, key: 'p1::' });
  });
  it('the same product + same note is one line, quantities add up', () => {
    let { cart } = add(emptyCart(), cake, { quantity: 1 });
    ({ cart } = add(cart, cake, { quantity: 2 }));
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });
  it('a different note makes a separate line (notes are trimmed)', () => {
    let { cart } = add(emptyCart(), cake, { customization: '  no nuts ' });
    ({ cart } = add(cart, cake, { customization: 'no nuts' }));
    ({ cart } = add(cart, cake, { customization: 'extra cream' }));
    expect(cart.items.map(i => i.customization)).toEqual(['no nuts', 'extra cream']);
    expect(cart.items[0].quantity).toBe(2);
  });
  it('never exceeds stock or the hard limit', () => {
    let { cart } = add(emptyCart(), cake, { quantity: 50 });
    expect(cart.items[0].quantity).toBe(5);
    ({ cart } = add(cart, cake, { quantity: 10 }));
    expect(cart.items[0].quantity).toBe(5);
    ({ cart } = add(emptyCart(), pie, { quantity: 500 }));
    expect(cart.items[0].quantity).toBe(MAX_QUANTITY);
  });
  it('junk quantities become 1', () => {
    for (const q of [0, -3, NaN, 'abc', undefined]) {
      const { cart } = add(emptyCart(), cake, { quantity: q === undefined ? undefined : q });
      expect(cart.items[0].quantity).toBe(1);
    }
  });
  it('caps the customization note length', () => {
    const { cart } = add(emptyCart(), cake, { customization: 'x'.repeat(MAX_CUSTOMIZATION + 50) });
    expect(cart.items[0].customization.length).toBe(MAX_CUSTOMIZATION);
  });
  it("another supplier's product is a conflict and changes nothing", () => {
    const { cart } = add(emptyCart(), cake);
    const out = add(cart, other);
    expect(out.conflict).toBe(true);
    expect(out.cart).toBe(cart);
  });
  it('replaceWith starts a new cart from the new supplier', () => {
    const { cart } = add(emptyCart(), cake);
    const out = replaceWith(cart, { product: other, supplier: shop2, quantity: 1 });
    expect(out.cart.supplierId).toBe('s2');
    expect(out.cart.items.map(i => i.productId)).toEqual(['p9']);
  });
  it('refuses a product with no supplier', () => {
    expect(addItem(emptyCart(), { product: { id: 'x', name: 'x', price: 1 } }).error).toBe('missing_supplier');
  });
});

describe('editing', () => {
  const base = () => add(add(emptyCart(), cake, { quantity: 2 }).cart, pie).cart;
  it('setQuantity clamps to stock, and <1 removes the line', () => {
    let cart = setQuantity(base(), itemKey('p1', ''), 9);
    expect(cart.items.find(i => i.productId === 'p1').quantity).toBe(5);
    cart = setQuantity(cart, itemKey('p1', ''), 0);
    expect(cart.items.map(i => i.productId)).toEqual(['p2']);
  });
  it('removing the last line empties the cart completely (supplier forgotten)', () => {
    let cart = removeItem(base(), itemKey('p1', ''));
    cart = removeItem(cart, itemKey('p2', ''));
    expect(cart).toEqual(emptyCart());
  });
  it('editing a note re-keys the line; identical notes merge', () => {
    let cart = add(add(emptyCart(), cake, { quantity: 1 }).cart, cake, { customization: 'no nuts', quantity: 2 }).cart;
    expect(cart.items).toHaveLength(2);
    cart = setCustomization(cart, itemKey('p1', 'no nuts'), '');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    cart = setCustomization(cart, itemKey('p1', ''), 'gift wrap');
    expect(cart.items[0]).toMatchObject({ key: 'p1::gift wrap', customization: 'gift wrap' });
  });
  it('unknown keys are ignored', () => {
    const cart = base();
    expect(setQuantity(cart, 'nope', 3).items).toHaveLength(2);
    expect(setCustomization(cart, 'nope', 'x')).toBe(cart);
  });
});

describe('totals and helpers', () => {
  it('count, subtotal (cent-exact), pre-order flag', () => {
    const cart = add(add(emptyCart(), cake, { quantity: 2 }).cart, pie, { quantity: 3 }).cart;
    expect(cartCount(cart)).toBe(5);
    expect(cartSubtotal(cart)).toBe(336.5);
    expect(hasPreorderItems(cart)).toBe(true);
    expect(hasPreorderItems(add(emptyCart(), cake).cart)).toBe(false);
  });
  it('float drift does not leak into money', () => {
    const cart = add(emptyCart(), { id: 'a', name: 'a', price: 0.1, stock: null, supplierId: 's1' }, { quantity: 3 }).cart;
    expect(cartSubtotal(cart)).toBe(0.3);
  });
  it('stockProblems lists lines above the (refreshed) stock', () => {
    const cart = add(emptyCart(), cake, { quantity: 4 }).cart;
    cart.items[0].stock = 2;
    expect(stockProblems(cart)).toEqual(['p1::']);
  });
  it('toOrderItems matches the API body (note only when present)', () => {
    const cart = add(add(emptyCart(), cake, { quantity: 2, customization: 'no nuts' }).cart, pie).cart;
    expect(toOrderItems(cart)).toEqual([{ productId: 'p1', quantity: 2, customization: 'no nuts' }, { productId: 'p2', quantity: 1 }]);
  });
});

describe('sanitizeStoredCart (localStorage is user-editable)', () => {
  const good = { supplierId: 's1', supplierName: 'Shop', items: [{ productId: 'p1', name: 'Cake', price: 10, quantity: 2, stock: 5, customization: ' hi ' }] };
  it('accepts a well-formed cart and rebuilds keys', () => {
    const c = sanitizeStoredCart(good);
    expect(c.items[0]).toMatchObject({ key: 'p1::hi', quantity: 2, customization: 'hi' });
  });
  it('rejects garbage wholesale', () => {
    for (const bad of [null, undefined, 'x', 42, [], {}, { items: 'no' }, { supplierId: 's1', items: [] }, { items: good.items }]) {
      expect(sanitizeStoredCart(bad)).toEqual(emptyCart());
    }
  });
  it('drops bad lines and clamps numbers', () => {
    const c = sanitizeStoredCart({
      supplierId: 's1',
      items: [
        { productId: 'a', name: 'A', price: -5, quantity: 1 },
        { productId: 'b', name: 'B', price: 'x', quantity: 1 },
        { productId: 7, name: 'C', price: 1, quantity: 1 },
        { productId: 'd', name: 'D', price: 3, quantity: 9999, stock: 4 },
        { productId: 'e', name: 'E', price: 3, quantity: -2 },
      ],
    });
    expect(c.items.map(i => [i.productId, i.quantity])).toEqual([['d', 4], ['e', 1]]);
  });
  it('merges duplicate lines', () => {
    const c = sanitizeStoredCart({ supplierId: 's1', items: [{ productId: 'a', name: 'A', price: 1, quantity: 2 }, { productId: 'a', name: 'A', price: 1, quantity: 3 }] });
    expect(c.items).toHaveLength(1);
    expect(c.items[0].quantity).toBe(5);
  });
});
