export const SORTS = ["default", "priceAsc", "priceDesc", "nameAsc"];

export const DEFAULT_FILTERS = Object.freeze({
  categories: [],
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
  preorderOnly: false,
  sort: "default",
});

const num = (v) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v))
    ? null
    : Number(v);

export function applyFilters(products, filters = DEFAULT_FILTERS) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const min = num(f.minPrice);
  const max = num(f.maxPrice);
  const wanted = new Set(f.categories.map((c) => String(c).toLowerCase()));

  let out = products.filter((p) => {
    if (wanted.size && !wanted.has(String(p.category ?? "").toLowerCase()))
      return false;
    if (min !== null && p.price < min) return false;
    if (max !== null && p.price > max) return false;
    if (
      f.inStockOnly &&
      !(
        p.isAvailable !== false &&
        (p.stock === null || p.stock === undefined || p.stock > 0)
      )
    )
      return false;
    if (f.preorderOnly && !p.requiresAdvanceOrder) return false;
    return true;
  });

  const sorted = [...out];
  if (f.sort === "priceAsc") sorted.sort((a, b) => a.price - b.price);
  else if (f.sort === "priceDesc") sorted.sort((a, b) => b.price - a.price);
  else if (f.sort === "nameAsc")
    sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return sorted;
}

export function countActiveFilters(filters = DEFAULT_FILTERS) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return (
    (f.categories.length ? 1 : 0) +
    (num(f.minPrice) !== null ? 1 : 0) +
    (num(f.maxPrice) !== null ? 1 : 0) +
    (f.inStockOnly ? 1 : 0) +
    (f.preorderOnly ? 1 : 0) +
    (f.sort !== "default" ? 1 : 0)
  );
}

export function extractCategories(products) {
  const seen = new Map();
  for (const p of products) {
    const c = String(p.category ?? "").trim();
    if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function filtersToParams(filters) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const p = new URLSearchParams();
  if (f.categories.length) p.set("cat", f.categories.join(","));
  if (num(f.minPrice) !== null) p.set("min", String(num(f.minPrice)));
  if (num(f.maxPrice) !== null) p.set("max", String(num(f.maxPrice)));
  if (f.inStockOnly) p.set("stock", "1");
  if (f.preorderOnly) p.set("pre", "1");
  if (f.sort !== "default") p.set("sort", f.sort);
  return p;
}

export function filtersFromParams(params) {
  const sort = params.get("sort");
  return {
    categories: (params.get("cat") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    minPrice: params.get("min") ?? "",
    maxPrice: params.get("max") ?? "",
    inStockOnly: params.get("stock") === "1",
    preorderOnly: params.get("pre") === "1",
    sort: SORTS.includes(sort) ? sort : "default",
  };
}
