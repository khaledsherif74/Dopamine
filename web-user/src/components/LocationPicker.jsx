import { useState } from 'react';
import { Alert, Button, Modal, TextField, addressSchema, useI18n, validate } from '@dopamine/web-shared';
import { useAppDispatch, useAppSelector, useAuth } from '@/lib/hooks.js';
import { locationChosen, locationCleared } from '@/features/location/locationSlice.js';
import { useAddAddressMutation, useDeleteAddressMutation, useListAddressesQuery } from '@/api/endpoints.js';

const emptyForm = { label: '', line1: '', city: '' };

export function LocationPicker({ open, onClose }) {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const { status } = useAuth();
  const current = useAppSelector(s => s.location);
  const signedIn = status === 'authenticated';
  const { data: addresses = [] } = useListAddressesQuery(undefined, { skip: !signedIn || !open });
  const [addAddress, { isLoading: saving }] = useAddAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [geo, setGeo] = useState({ state: 'idle' }); // idle | busy | denied | unsupported
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) return setGeo({ state: 'unsupported' });
    setGeo({ state: 'busy' });
    navigator.geolocation.getCurrentPosition(
      pos => {
        dispatch(locationChosen({ addressId: null, label: t('location.current'), lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setGeo({ state: 'idle' });
        onClose();
      },
      () => setGeo({ state: 'denied' }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  function pick(address) {
    dispatch(locationChosen({ addressId: address.id, label: address.label, lat: address.lat ?? null, lng: address.lng ?? null }));
    onClose();
  }

  async function submit(e) {
    e.preventDefault();
    const result = validate(addressSchema, form);
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      const created = await addAddress({ ...result.values, isDefault: addresses.length === 0 }).unwrap();
      setForm(emptyForm);
      setShowForm(false);
      pick(created);
    } catch {
      setErrors({ _: t('errors.generic') });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('location.title')} closeLabel={t('common.close')}>
      <div className="space-y-4">
        <Button variant="outline" className="w-full" loading={geo.state === 'busy'} onClick={useMyLocation}>
          {geo.state === 'busy' ? t('location.locating') : t('location.useCurrent')}
        </Button>
        {geo.state === 'denied' ? <Alert tone="warning">{t('location.denied')}</Alert> : null}
        {geo.state === 'unsupported' ? <Alert tone="warning">{t('location.unsupported')}</Alert> : null}

        <section aria-labelledby="saved-addresses">
          <h3 id="saved-addresses" className="mb-2 text-sm font-semibold text-text-primary">{t('location.savedAddresses')}</h3>
          {!signedIn ? (
            <p className="text-sm text-text-secondary">{t('location.signInHint')}</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-text-secondary">{t('location.noAddresses')}</p>
          ) : (
            <ul className="space-y-2">
              {addresses.map(a => (
                <li key={a.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => pick(a)}
                    aria-pressed={current.addressId === a.id}
                    className={`flex-1 rounded-xl border p-3 text-start ${current.addressId === a.id ? 'border-primary bg-primary-tint' : 'border-border hover:bg-surface-alt'}`}
                  >
                    <span className="block font-semibold text-text-primary">{a.label}</span>
                    <span className="block text-sm text-text-secondary">{a.line1}, {a.city}</span>
                  </button>
                  <button type="button" onClick={() => deleteAddress(a.id)} aria-label={`${t('location.remove')}: ${a.label}`} className="rounded-full p-2 text-danger hover:bg-surface-alt">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M10 7V5h4v2M8 7l1 12h6l1-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {signedIn ? (
          showForm ? (
            <form onSubmit={submit} noValidate className="space-y-3 rounded-xl border border-border p-3">
              <TextField label={t('location.label')} value={form.label} error={errors.label && t(errors.label)} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              <TextField label={t('location.line1')} value={form.line1} error={errors.line1 && t(errors.line1)} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} autoComplete="street-address" />
              <TextField label={t('location.city')} value={form.city} error={errors.city && t(errors.city)} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} autoComplete="address-level2" />
              {errors._ ? <Alert tone="danger">{errors._}</Alert> : null}
              <div className="flex gap-2">
                <Button type="submit" loading={saving} className="flex-1">{t('location.save')}</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
              </div>
            </form>
          ) : (
            <Button variant="ghost" onClick={() => setShowForm(true)}>+ {t('location.addAddress')}</Button>
          )
        ) : null}

        {current.lat != null ? (
          <Button variant="ghost" className="text-danger" onClick={() => { dispatch(locationCleared()); onClose(); }}>
            {t('location.clear')}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
