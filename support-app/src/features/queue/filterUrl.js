import { DEFAULT_FILTER, STATUS_FILTERS, TABS } from './ticketQueue.js';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../tickets/ticketStatus.js';

const SEARCH_MAX = 100;
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

// The queue view lives in the URL (shareable, survives reload). Anything unknown falls back to
// the default so a hand-edited URL can never put a strange value into an API call.
export function filterFromParams(params) {
  return {
    tab: pick(params.get('tab'), TABS, DEFAULT_FILTER.tab),
    status: pick(params.get('status'), STATUS_FILTERS, DEFAULT_FILTER.status),
    priority: pick(params.get('priority'), TICKET_PRIORITIES, ''),
    category: pick(params.get('category'), TICKET_CATEGORIES, ''),
    search: (params.get('q') ?? '').trim().slice(0, SEARCH_MAX),
  };
}

export function filterToParams(filter) {
  const params = new URLSearchParams();
  if (filter.tab !== DEFAULT_FILTER.tab) params.set('tab', filter.tab);
  if (filter.status !== DEFAULT_FILTER.status) params.set('status', filter.status);
  if (filter.priority) params.set('priority', filter.priority);
  if (filter.category) params.set('category', filter.category);
  if (filter.search) params.set('q', filter.search);
  return params;
}
