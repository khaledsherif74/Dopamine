import { createSlice } from '@reduxjs/toolkit';
import { readJson, writeJson } from '@dopamine/web-shared';

const KEY = 'dopamine.user.location.v1';
const valid = v => v && typeof v === 'object' && (v.addressId === null || typeof v.addressId === 'string');
const initial = () => {
  const stored = readJson(KEY);
  const lat = Number(stored?.lat);
  const lng = Number(stored?.lng);
  return valid(stored) && Number.isFinite(lat) && Number.isFinite(lng)
    ? { addressId: stored.addressId, label: String(stored.label ?? ''), lat, lng }
    : { addressId: null, label: '', lat: null, lng: null };
};

const slice = createSlice({
  name: 'location',
  initialState: initial,
  reducers: {
    locationChosen: (_s, { payload }) => ({
      addressId: payload.addressId ?? null,
      label: payload.label ?? '',
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
    }),
    locationCleared: () => ({ addressId: null, label: '', lat: null, lng: null }),
  },
});

export const { locationChosen, locationCleared } = slice.actions;
export default slice.reducer;
export const persistLocation = store => store.subscribe(() => writeJson(KEY, store.getState().location));
