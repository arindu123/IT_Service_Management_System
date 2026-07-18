import { AlertBanner } from "../../design-system";

export default function SystemAlerts({ model }) {
  const { attention } = model;
  if (!attention.total) {
    return <AlertBanner tone="success" title="No critical system alerts">All reported service areas are within their current operating thresholds.</AlertBanner>;
  }

  const details = [
    attention.pendingApprovals && `${attention.pendingApprovals} request(s) awaiting review`,
    attention.damagedAssets && `${attention.damagedAssets} damaged asset(s)`,
    attention.lowStock && `${attention.lowStock} inventory alert(s)`,
  ].filter(Boolean).join(" · ");

  return <AlertBanner tone="warning" title="Operational items require attention">{details}</AlertBanner>;
}
