import { createSlice } from '@reduxjs/toolkit';
import { readJson, writeJson } from '@dopamine/web-shared';
import { addItem, emptyCart, removeItem, replaceWith, sanitizeStoredCart, setCustomization, setQuantity } from './cartLogic.js';

export const CART_STORAGE_KEY = 'dopamine.user.cart.v1';

export const loadCart = () => sanitizeStoredCart(readJson(CART_STORAGE_KEY));
export const persistCart = cart => writeJson(CART_STORAGE_KEY, cart);

const slice = createSlice({
  name: 'cart',
  initialState: loadCart,
  reducers: {
    // payload: { product, supplier, quantity?, customization? }. A conflict (other supplier) is
    // stored so the UI can show the "start a new cart?" dialog, nothing else changes.
    itemAdded(state, { payload }) {
      const out = addItem({ supplierId: state.supplierId, supplierName: state.supplierName, items: state.items }, payload);
      if (out.conflict) return { ...state, pendingConflict: payload };
      return { ...out.cart };
    },
    conflictResolved(state, { payload: replace }) {
      if (!state.pendingConflict) return state;
      if (!replace) {
        const { pendingConflict, ...rest } = state;
        return rest;
      }
      return { ...replaceWith(emptyCart(), state.pendingConflict).cart };
    },
    quantityChanged: (state, { payload }) => ({ ...setQuantity(state, payload.key, payload.quantity) }),
    customizationChanged: (state, { payload }) => ({ ...setCustomization(state, payload.key, payload.customization) }),
    itemRemoved: (state, { payload }) => ({ ...removeItem(state, payload) }),
    cartCleared: () => emptyCart(),
    cartReplaced: (_state, { payload }) => sanitizeStoredCart(payload),
  },
});

export const { itemAdded, conflictResolved, quantityChanged, customizationChanged, itemRemoved, cartCleared, cartReplaced } = slice.actions;
export default slice.reducer;

// persist (without transient UI state) after every change
export const cartPersistence = store => {
  let last = null;
  return store.subscribe(() => {
    const { supplierId, supplierName, items } = store.getState().cart;
    const snapshot = { supplierId, supplierName, items };
    if (JSON.stringify(snapshot) !== last) {
      last = JSON.stringify(snapshot);
      persistCart(snapshot);
    }
  });
};

export const selectCart = state => state.cart;
