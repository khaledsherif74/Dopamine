import { useState } from 'react';
import { Button, useI18n } from '@dopamine/web-shared';
import { filterCanned } from '@/features/canned/canned.js';

// Lists the agent's canned replies; picking one hands its text to the composer.
export function CannedPicker({ list, onPick }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  if (list.length === 0) return null;
  const shown = filterCanned(list, query);
  return (
    <div>
      <Button variant="ghost" size="sm" aria-expanded={open} aria-controls="canned-list" onClick={() => setOpen(o => !o)}>
        {t('canned.insert')}
      </Button>
      {open ? (
        <div id="canned-list" className="mt-2 rounded-2xl border border-border bg-surface p-3">
          <label htmlFor="canned-search" className="sr-only">{t('canned.search')}</label>
          <input id="canned-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('canned.search')} className="mb-2 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary" />
          {shown.length === 0 ? <p className="text-sm text-text-secondary">{t('canned.noMatch')}</p> : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {shown.map(r => (
                <li key={r.id}>
                  <button type="button" onClick={() => { onPick(r.body); setOpen(false); setQuery(''); }} className="w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-surface-alt">
                    <span className="block font-semibold text-text-primary">{r.title}</span>
                    <span className="line-clamp-2 text-text-secondary">{r.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
