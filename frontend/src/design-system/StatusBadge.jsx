import { cx } from "./utils";

const tones = { submitted:"info", approved:"success", rejected:"danger", completed:"success", pending:"warning", online:"success", offline:"danger", low_stock:"warning", "low stock":"warning" };
export function StatusBadge({ status, label, tone, className }) {
  const normalized = String(status || "").toLowerCase().replace(/-/g, "_");
  const resolvedTone = tone || tones[normalized] || "neutral";
  return <span className={cx("gov-status", `gov-status--${resolvedTone}`, className)}>{label || String(status || "Unknown").replace(/_/g, " ")}</span>;
}
