const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseBillDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "string" && DATE_ONLY_RE.test(value)) {
    const parsedDateOnly = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsedDateOnly.getTime()) ? null : parsedDateOnly;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveBillDate(payload = {}, { fallbackDate = new Date() } = {}) {
  const candidate =
    payload.requestedInvoiceDate ??
    payload.invoiceDate ??
    payload.requestedBillDate ??
    payload.billDate;

  const parsed = parseBillDate(candidate);
  return parsed || new Date(fallbackDate);
}

module.exports = {
  parseBillDate,
  resolveBillDate,
};