import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Modal,
  TextField,
  apiErrorMessage,
  useI18n,
} from "@dopamine/web-shared";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/api/endpoints.js";
import {
  emptyProduct,
  productFormFrom,
  toFormData,
  updateFields,
  validateImage,
  validateProduct,
} from "@/features/products/productForm.js";
import { ProductImage } from "@/components/Media.jsx";

export function ProductDialog({ product, onClose }) {
  const { t } = useI18n();
  const editing = !!product;
  const [form, setForm] = useState(() =>
    product ? productFormFrom(product) : emptyProduct(),
  );
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [create, c] = useCreateProductMutation();
  const [update, u] = useUpdateProductMutation();
  const busy = c.isLoading || u.isLoading;

  const preview = useMemo(
    () => (image ? URL.createObjectURL(image) : null),
    [image],
  );
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function pickImage(e) {
    const file = e.target.files?.[0] ?? null;
    const problem = validateImage(file);
    setErrors((prev) => ({ ...prev, image: problem ?? undefined }));
    setImage(problem ? null : file);
    if (problem) e.target.value = "";
  }

  async function submit() {
    setServerError("");
    const result = validateProduct(form);
    const imageError = validateImage(image);
    const nextErrors = {
      ...result.errors,
      ...(imageError ? { image: imageError } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      if (editing) {
        const changes = updateFields(product, result.values, !!image);
        if (!changes) {
          setServerError(t("products.errors.nothingChanged"));
          return;
        }
        await update({
          id: product.id,
          body: toFormData(changes, image),
        }).unwrap();
      } else {
        const { isAvailable: _ignored, ...fields } = result.values;
        await create(toFormData(fields, image)).unwrap();
      }
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={editing ? t("products.editTitle") : t("products.addTitle")}
      closeLabel={t("common.close")}
    >
      <div className="space-y-3">
        <TextField
          label={t("products.name")}
          value={form.name}
          maxLength={120}
          error={errors.name && t(errors.name)}
          onChange={set("name")}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={t("products.price")}
            inputMode="decimal"
            dir="ltr"
            value={form.price}
            error={errors.price && t(errors.price)}
            onChange={set("price")}
          />
          <TextField
            label={t("products.stock")}
            inputMode="numeric"
            dir="ltr"
            value={form.stock}
            error={errors.stock && t(errors.stock)}
            onChange={set("stock")}
          />
        </div>
        <TextField
          label={t("products.category")}
          value={form.category}
          maxLength={60}
          error={errors.category && t(errors.category)}
          onChange={set("category")}
        />
        <div>
          <label
            htmlFor="product-description"
            className="mb-1 block text-sm font-medium text-text-primary"
          >
            {t("products.description")}
          </label>
          <textarea
            id="product-description"
            rows={3}
            maxLength={1000}
            value={form.description}
            aria-invalid={!!errors.description}
            onChange={set("description")}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
          {errors.description ? (
            <p role="alert" className="text-sm text-danger">
              {t(errors.description)}
            </p>
          ) : null}
          {editing ? (
            <p className="mt-1 text-xs text-text-secondary">
              {t("products.cannotClear")}
            </p>
          ) : null}
        </div>
        <Checkbox
          label={t("products.advanceOrder")}
          checked={form.requiresAdvanceOrder}
          onChange={(e) =>
            setForm((f) => ({ ...f, requiresAdvanceOrder: e.target.checked }))
          }
        />
        {editing ? (
          <Checkbox
            label={t("products.available")}
            checked={form.isAvailable}
            onChange={(e) =>
              setForm((f) => ({ ...f, isAvailable: e.target.checked }))
            }
          />
        ) : null}
        <div>
          <label
            htmlFor="product-image"
            className="mb-1 block text-sm font-medium text-text-primary"
          >
            {t("products.image")}
          </label>
          <div className="flex items-center gap-3">
            <ProductImage
              src={preview ?? product?.imageUrl}
              alt=""
              className="h-16 w-16 rounded-xl"
            />
            <input
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pickImage}
              aria-invalid={!!errors.image}
              className="text-sm text-text-primary"
            />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {t("products.imageHint")}
          </p>
          {errors.image ? (
            <p role="alert" className="text-sm text-danger">
              {t(errors.image)}
            </p>
          ) : null}
        </div>
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button loading={busy} onClick={submit}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
