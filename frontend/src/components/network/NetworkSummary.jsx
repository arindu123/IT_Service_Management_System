import { Card } from "../../design-system";

export default function NetworkSummary({ summary, formatDateTime }) {
  const status = summary?.byStatus || {};
  const lastCycleAt = summary?.scheduler?.lastCycleAt;
  const cards = [
    ["Total devices", summary?.total ?? 0, "neutral"],
    ["Online", status.online ?? 0, "success"],
    ["Warning", status.warning ?? 0, "warning"],
    ["Offline", status.offline ?? 0, "danger"],
    ["Paused", status.paused ?? 0, "neutral"],
    ["Open incidents", summary?.openIncidentCount ?? 0, "danger"],
    ["Last monitoring cycle", lastCycleAt ? formatDateTime(lastCycleAt) : "Not checked", "info"],
  ];
  return <div className="network-summary">{cards.map(([label, value, tone]) => <Card key={label} className={`network-summary-card network-summary-card--${tone}`}><span>{label}</span><strong>{value}</strong></Card>)}</div>;
}
