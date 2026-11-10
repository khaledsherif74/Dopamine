import { Button, Modal, useI18n } from "@dopamine/web-shared";
import { useAppDispatch, useAppSelector } from "@/lib/hooks.js";
import { conflictResolved } from "@/features/cart/cartSlice.js";

export function CartConflictDialog() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.cart);
  const pending = cart.pendingConflict;
  return (
    <Modal
      open={!!pending}
      onClose={() => dispatch(conflictResolved(false))}
      title={t("cart.conflictTitle")}
      closeLabel={t("common.close")}
    >
      <p className="mb-5 text-text-secondary">
        {t("cart.conflictBody", { shop: cart.supplierName ?? "" })}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          className="flex-1"
          onClick={() => dispatch(conflictResolved(true))}
        >
          {t("cart.conflictReplace")}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => dispatch(conflictResolved(false))}
        >
          {t("cart.conflictKeep")}
        </Button>
      </div>
    </Modal>
  );
}
