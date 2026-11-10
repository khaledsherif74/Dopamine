import { parseAmount } from "../../lib/money.js";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const STOCK_MAX = 99999;

export const emptyProduct = () => ({
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "0",
  requiresAdvanceOrder: false,
  isAvailable: true,
});

export function productFormFrom(product) {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    price: String(product.price ?? ""),
    category: product.category ?? "",
    stock: String(product.stock ?? 0),
    requiresAdvanceOrder: !!product.requiresAdvanceOrder,
    isAvailable: product.isAvailable !== false,
  };
}

export function validateProduct(form) {
  const errors = {};
  const name = String(form.name ?? "").trim();
  const description = String(form.description ?? "").trim();
  const category = String(form.category ?? "").trim();
  const price = parseAmount(form.price);
  const stockText = String(form.stock ?? "").trim();

  if (name.length < 2 || name.length > 120)
    errors.name = "products.errors.name";
  if (price === null) errors.price = "products.errors.price";
  if (description.length > 1000)
    errors.description = "products.errors.descriptionLong";
  if (category.length > 60) errors.category = "products.errors.categoryLong";
  let stock = 0;
  if (stockText !== "") {
    stock = /^\d+$/.test(stockText) ? Number(stockText) : NaN;
    if (!(stock >= 0 && stock <= STOCK_MAX))
      errors.stock = "products.errors.stock";
  }
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      name,
      description,
      price,
      category,
      stock,
      requiresAdvanceOrder: !!form.requiresAdvanceOrder,
      isAvailable: form.isAvailable !== false,
    },
  };
}

export function diffProduct(original, values) {
  const out = {};
  for (const key of [
    "name",
    "price",
    "stock",
    "requiresAdvanceOrder",
    "isAvailable",
  ]) {
    if (
      values[key] !==
      (key === "requiresAdvanceOrder" || key === "isAvailable"
        ? !!original[key]
        : original[key])
    )
      out[key] = values[key];
  }
  for (const key of ["description", "category"]) {
    if (values[key] !== "" && values[key] !== (original[key] ?? ""))
      out[key] = values[key];
  }
  return out;
}

export function updateFields(original, values, hasImage) {
  const changes = diffProduct(original, values);
  if (Object.keys(changes).length > 0) return changes;
  return hasImage ? { name: original.name } : null;
}

export function validateImage(file) {
  if (!file) return null;
  if (!IMAGE_TYPES.includes(file.type) || !(file.size > 0))
    return "products.errors.imageType";
  if (file.size > MAX_IMAGE_BYTES) return "products.errors.imageSize";
  return null;
}

export function toFormData(fields, image) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields))
    if (value !== undefined && value !== null) body.append(key, String(value));
  if (image) body.append("image", image);
  return body;
}
