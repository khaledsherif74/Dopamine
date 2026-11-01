import { describe, it, expect } from 'vitest';
import { applyFilters, countActiveFilters, extractCategories, filtersToParams, filtersFromParams, DEFAULT_FILTERS } from '../src/features/browse/filters.js';

const P = [
  { id: 1, name: 'Chocolate Cake', price: 120, category: 'Cakes', stock: 5, isAvailable: true },
  { id: 2, name: 'Apple Pie', price: 60, category: 'Pies', stock: 0, isAvailable: true },
  { id: 3, name: 'Birthday Cake', price: 300, category: 'cakes', stock: null, isAvailable: true, requiresAdvanceOrder: true },
  { id: 4, name: 'Brownie', price: 25, category: 'Brownies', stock: 10, isAvailable: false },
];
const ids = list => list.map(p => p.id);

describe('applyFilters', () => {
  it('defaults keep everything in original order', () => {
    expect(ids(applyFilters(P))).toEqual([1, 2, 3, 4]);
  });
  it('category match is case-insensitive and multi-select', () => {
    expect(ids(applyFilters(P, { categories: ['Cakes'] }))).toEqual([1, 3]);
    expect(ids(applyFilters(P, { categories: ['pies', 'brownies'] }))).toEqual([2, 4]);
  });
  it('price range is inclusive; blank or junk bounds are ignored', () => {
    expect(ids(applyFilters(P, { minPrice: '60', maxPrice: '120' }))).toEqual([1, 2]);
    expect(ids(applyFilters(P, { minPrice: '', maxPrice: 'abc' }))).toEqual([1, 2, 3, 4]);
  });
  it('in stock only drops zero stock and unavailable, keeps unlimited stock', () => {
    expect(ids(applyFilters(P, { inStockOnly: true }))).toEqual([1, 3]);
  });
  it('pre-order only', () => {
    expect(ids(applyFilters(P, { preorderOnly: true }))).toEqual([3]);
  });
  it('sorting never mutates the input', () => {
    const copy = [...P];
    expect(ids(applyFilters(P, { sort: 'priceAsc' }))).toEqual([4, 2, 1, 3]);
    expect(ids(applyFilters(P, { sort: 'priceDesc' }))).toEqual([3, 1, 2, 4]);
    expect(ids(applyFilters(P, { sort: 'nameAsc' }))).toEqual([2, 3, 4, 1]);
    expect(P).toEqual(copy);
  });
  it('combines filters', () => {
    expect(ids(applyFilters(P, { categories: ['cakes'], maxPrice: 200, sort: 'priceDesc' }))).toEqual([1]);
  });
});

describe('helpers', () => {
  it('countActiveFilters counts each active control once', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countActiveFilters({ categories: ['a', 'b'], minPrice: '5', maxPrice: '', inStockOnly: true, sort: 'priceAsc' })).toBe(4);
  });
  it('extractCategories de-duplicates case-insensitively and sorts', () => {
    expect(extractCategories(P)).toEqual(['Brownies', 'Cakes', 'Pies']);
    expect(extractCategories([{ category: null }, { category: '  ' }])).toEqual([]);
  });
  it('round-trips through URL params; unknown sort falls back', () => {
    const f = { categories: ['Cakes', 'Pies'], minPrice: '10', maxPrice: '99', inStockOnly: true, preorderOnly: false, sort: 'priceDesc' };
    expect(filtersFromParams(filtersToParams(f))).toEqual(f);
    expect(filtersFromParams(new URLSearchParams('sort=evil')).sort).toBe('default');
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
  });
});
