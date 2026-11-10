export function apiErrorMessage(error, t) {
  if (!error) return t("errors.generic");
  const status = error.status;

  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR")
    return t("errors.network");
  if (status === 429) return t("errors.tooMany");
  if (status === 503) return t("errors.maintenance");

  const data = error.data;
  const detail = Array.isArray(data?.details)
    ? data.details.find((d) => typeof d?.message === "string")
    : null;
  if (typeof status === "number" && status >= 400 && status < 500) {
    if (detail && !/^[A-Z_]+$/.test(detail.message)) return detail.message;
    if (typeof data?.message === "string" && data.message) return data.message;
    if (status === 401) return t("errors.unauthorized");
    if (status === 403) return t("errors.forbidden");
    if (status === 404) return t("errors.notFound");
  }
  return t("errors.generic");
}

export function apiErrorCode(error) {
  const d = error?.data?.details;
  const code = Array.isArray(d)
    ? d.find(
        (x) => typeof x?.message === "string" && /^[A-Z_]+$/.test(x.message),
      )
    : null;
  return code?.message ?? null;
}
