import { useEffect, useState } from 'react';
import { Button, Checkbox, Modal, SelectField, TextField, useI18n } from '@dopamine/web-shared';
import { DEFAULT_FILTERS, SORTS } from '@/features/browse/filters.js';

export function FilterModal({ open, onClose, filters, categories, onApply }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(filters);
  // start from the applied filters every time the dialog opens
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const toggleCategory = name =>
    setDraft(d => ({ ...d, categories: d.categories.includes(name) ? d.categories.filter(c => c !== name) : [...d.categories, name] }));

  return (
    <Modal open={open} onClose={onClose} title={t('filters.title')} closeLabel={t('common.close')}>
      <div className="space-y-5">
        {categories.length ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-text-primary">{t('filters.categories')}</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => {
                const on = draft.categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCategory(c)}
                    className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-primary bg-primary text-text-inverse' : 'border-border text-text-primary hover:bg-surface-alt'}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text-primary">{t('filters.price')}</legend>
          <div className="grid grid-cols-2 gap-3">
            <TextField label={t('filters.min')} type="number" inputMode="decimal" min="0" value={draft.minPrice} onChange={e => setDraft(d => ({ ...d, minPrice: e.target.value }))} />
            <TextField label={t('filters.max')} type="number" inputMode="decimal" min="0" value={draft.maxPrice} onChange={e => setDraft(d => ({ ...d, maxPrice: e.target.value }))} />
          </div>
        </fieldset>

        <Checkbox label={t('filters.inStock')} checked={draft.inStockOnly} onChange={e => setDraft(d => ({ ...d, inStockOnly: e.target.checked }))} />
        <Checkbox label={t('filters.preorder')} checked={draft.preorderOnly} onChange={e => setDraft(d => ({ ...d, preorderOnly: e.target.checked }))} />

        <SelectField
          label={t('filters.sort')}
          value={draft.sort}
          onChange={e => setDraft(d => ({ ...d, sort: e.target.value }))}
          options={SORTS.map(s => ({ value: s, label: t(`filters.sortOptions.${s}`) }))}
        />

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDraft(DEFAULT_FILTERS)}>
            {t('products.resetFilters')}
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {t('filters.show')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
