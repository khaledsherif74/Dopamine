// The API answers { success, data }. List endpoints put the array under a key, e.g.
// GET /orders/:id/refunds -> data: { refunds: [...] }. Pages call .some / .map / .length on the result,
// so this ALWAYS returns an array (a missing or malformed list is an empty list, never a crash).
export function unwrapList(response, key) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  const list = data?.[key];
  return Array.isArray(list) ? list : [];
}
