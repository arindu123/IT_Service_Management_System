import { StatusBadge } from "../../design-system";

const tones = {
  submitted:"info", acknowledged:"info", need_more_information:"warning", under_review:"warning",
  technician_assigned:"info", inventory_check:"warning", procurement_required:"warning", in_procurement:"warning",
  item_available:"success", installation_scheduled:"info", installed:"success", closed:"neutral",
  rejected:"danger", cancelled:"danger", draft:"neutral",
};

export default function RequestStatus({ status, enumLabel }) {
  return <StatusBadge status={status} tone={tones[status] || "neutral"} label={enumLabel ? enumLabel("status", status) : undefined} />;
}

export function PriorityBadge({ priority, enumLabel }) {
  const tone = priority === "critical" ? "danger" : priority === "high" ? "warning" : priority === "low" ? "success" : "info";
  return <StatusBadge tone={tone} label={enumLabel ? enumLabel("priority", priority) : priority} />;
}
