import { describe, it, expect } from 'vitest';
import { validateProduct, diffProduct, validateImage, toFormData, emptyProduct, MAX_IMAGE_BYTES, updateFields } from '../src/features/products/productForm.js';

const ok = o => ({ ...emptyProduct(), name: 'Tiramisu', price: '45.5', ...o });

describe('create / edit product form (mirrors product.validation)', () => {
  it('accepts a minimal product and normalises it', () => {
    const r = validateProduct(ok({ stock: '12', category: ' Cakes ', description: ' Rich ' }));
    expect(r).toEqual({ ok: true, errors: {}, values: { name: 'Tiramisu', description: 'Rich', price: 45.5, category: 'Cakes', stock: 12, requiresAdvanceOrder: false, isAvailable: true } });
  });
  it('name 2..120', () => {
    expect(validateProduct(ok({ name: ' a ' })).errors.name).toBe('products.errors.name');
    expect(validateProduct(ok({ name: 'x'.repeat(121) })).errors.name).toBe('products.errors.name');
  });
  it('price: > 0 with at most 2 decimals', () => {
    for (const p of ['', '0', '-1', 'abc', '1.234']) expect(validateProduct(ok({ price: p })).errors.price).toBe('products.errors.price');
    expect(validateProduct(ok({ price: '10' })).ok).toBe(true);
    expect(validateProduct(ok({ price: '0.5' })).values.price).toBe(0.5);
  });
  it('stock: whole number >= 0 (empty = 0)', () => {
    expect(validateProduct(ok({ stock: '' })).values.stock).toBe(0);
    for (const s of ['-1', '1.5', 'x']) expect(validateProduct(ok({ stock: s })).errors.stock).toBe('products.errors.stock');
    expect(validateProduct(ok({ stock: '100000' })).errors.stock).toBe('products.errors.stock');
  });
  it('description <= 1000, category <= 60', () => {
    expect(validateProduct(ok({ description: 'x'.repeat(1001) })).errors.description).toBe('products.errors.descriptionLong');
    expect(validateProduct(ok({ category: 'x'.repeat(61) })).errors.category).toBe('products.errors.categoryLong');
  });
});

describe('edit sends only what changed (the API cannot clear text fields, and needs >= 1 field)', () => {
  const original = { name: 'Tiramisu', description: 'Rich', price: 45.5, category: 'Cakes', stock: 12, requiresAdvanceOrder: false, isAvailable: true };
  it('diff', () => {
    const v = validateProduct({ ...ok({ stock: '10', category: 'Cakes', description: 'Rich', price: '45.5' }) }).values;
    expect(diffProduct(original, v)).toEqual({ stock: 10 });
    expect(diffProduct(original, { ...v, stock: 12 })).toEqual({});
  });
  it('emptied optional text is not sent (cannot be cleared) instead of failing validation', () => {
    const v = validateProduct(ok({ description: '', category: '' })).values;
    expect(diffProduct(original, v)).toEqual({ stock: 0 });
  });
  it('availability and advance-order flags are diffed', () => {
    expect(diffProduct(original, { ...original, isAvailable: false, requiresAdvanceOrder: true })).toEqual({ isAvailable: false, requiresAdvanceOrder: true });
  });
});

describe('update request (the API rejects an empty PATCH body: updateProductSchema.min(1))', () => {
  const original = { name: 'Tiramisu', description: 'Rich', price: 45.5, category: 'Cakes', stock: 12, requiresAdvanceOrder: false, isAvailable: true };
  const same = validateProduct({ name: 'Tiramisu', description: 'Rich', price: '45.5', category: 'Cakes', stock: '12', requiresAdvanceOrder: false, isAvailable: true }).values;
  it('nothing changed and no photo: nothing to send (null)', () => expect(updateFields(original, same, false)).toBeNull());
  it('only a new photo: re-sends the current name so the body is not empty', () => expect(updateFields(original, same, true)).toEqual({ name: 'Tiramisu' }));
  it('real changes are sent as they are, with or without a photo', () => {
    expect(updateFields(original, { ...same, stock: 3 }, false)).toEqual({ stock: 3 });
    expect(updateFields(original, { ...same, stock: 3 }, true)).toEqual({ stock: 3 });
  });
});

describe('image upload (mirrors upload.middleware: jpeg/png/webp, 5 MB)', () => {
  const file = (type, size) => ({ type, size, name: 'a' });
  it('accepts the allowed types up to the limit', () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    for (const t of ['image/jpeg', 'image/png', 'image/webp']) expect(validateImage(file(t, 1000))).toBeNull();
    expect(validateImage(file('image/png', MAX_IMAGE_BYTES))).toBeNull();
  });
  it('rejects other types, too big and empty files; no file is fine', () => {
    expect(validateImage(file('image/gif', 10))).toBe('products.errors.imageType');
    expect(validateImage(file('application/pdf', 10))).toBe('products.errors.imageType');
    expect(validateImage(file('image/png', MAX_IMAGE_BYTES + 1))).toBe('products.errors.imageSize');
    expect(validateImage(file('image/png', 0))).toBe('products.errors.imageType');
    expect(validateImage(null)).toBeNull();
  });
});

describe('multipart body', () => {
  it('fields become strings, the image goes under "image", undefined is skipped', () => {
    const f = toFormData({ name: 'A', price: 5, stock: 0, requiresAdvanceOrder: true, description: undefined }, new Blob(['x'], { type: 'image/png' }));
    const entries = [...f.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : 'FILE']);
    expect(entries).toEqual([['name', 'A'], ['price', '5'], ['stock', '0'], ['requiresAdvanceOrder', 'true'], ['image', 'FILE']]);
  });
});
