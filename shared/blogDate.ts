const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Store and show dates like the existing articles: "7, Oct 2026". */
export function formatBlogDate(value: string) {
  const trimmed = String(value || "").trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!iso) return trimmed;
  const month = MONTHS[Number(iso[2]) - 1];
  if (!month) return trimmed;
  return `${Number(iso[3])}, ${month} ${iso[1]}`;
}

/** Turn a stored blog date back into a value for <input type="date">. */
export function blogDateToInput(value: string) {
  const trimmed = String(value || "").trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const pretty = trimmed.match(/^(\d{1,2}),\s*([A-Za-z]{3,})\s+(\d{4})$/);
  if (!pretty) return "";
  const monthIndex = MONTHS.findIndex((month) => pretty[2].toLowerCase().startsWith(month.toLowerCase()));
  if (monthIndex < 0) return "";
  return `${pretty[3]}-${String(monthIndex + 1).padStart(2, "0")}-${pretty[1].padStart(2, "0")}`;
}
