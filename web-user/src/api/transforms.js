export function unwrapList(response, key) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  const list = data?.[key];
  return Array.isArray(list) ? list : [];
}
