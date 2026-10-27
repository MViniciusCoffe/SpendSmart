const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

/**
 * Formats a "YYYY-MM-DD" date as dd/mm/aaaa.
 * `new Date("YYYY-MM-DD")` is read as UTC midnight, which shows the previous
 * day in negative-offset time zones (e.g. Brazil), so the parts are parsed manually.
 */
export function formatDate(dateString) {
  if (!dateString) return "—"
  const [year, month, day] = String(dateString).slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return "—"
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR")
}

// Soft-deleted categories still name their old transactions (US-009, CA-009.05)
export function formatCategoryName(category) {
  if (!category) return ""
  return category.deleted_at ? `${category.name} (deletada)` : category.name
}

/**
 * Parses an amount typed in Brazilian notation ("1.234,56", "190,5") or plain
 * ("1234.56"). Returns NaN when the text is not a number.
 */
export function parseAmount(text) {
  const value = String(text ?? "")
    .trim()
    .replace(/^R\$\s*/, "")
  if (!value) return NaN
  let normalized = value
  if (value.includes(",")) {
    // Comma is the decimal separator, so dots are thousands separators
    normalized = value.replace(/\./g, "").replace(",", ".")
  } else if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    normalized = value.replace(/\./g, "")
  }
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN
}
