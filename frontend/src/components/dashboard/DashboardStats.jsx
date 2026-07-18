import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, StatusBadge } from "../../design-system";

function StatCard({ title, value, detail, status, actionLabel, onAction, disabled = false }) {
  return (
    <Card className="dashboard-stat-card">
      <CardBody>
        <div className="dashboard-stat-heading"><h2>{title}</h2>{status && <StatusBadge {...status} />}</div>
        <strong className="dashboard-stat-value">{value}</strong>
        <p>{detail}</p>
        {actionLabel && <Button variant="ghost" disabled={disabled} onClick={onAction}>{actionLabel}</Button>}
      </CardBody>
    </Card>
  );
}

export default function DashboardStats({ model, canViewInventory, canViewNetwork }) {
  const navigate = useNavigate();
  const networkValue = model.network.available ? model.network.online : "—";
  return (
    <section aria-labelledby="operational-summary-title">
      <div className="dashboard-section-title"><div><h2 id="operational-summary-title">Operational summary</h2><p>Current workload and service availability.</p></div></div>
      <div className="dashboard-stats-grid">
        <StatCard title="Open Requests" value={model.activeQueue} detail={`${model.tickets.submitted} pending submission(s)`} actionLabel="View requests" onAction={() => navigate("/tickets")} />
        <StatCard title="Pending Approvals" value={model.pendingApprovals} detail="Requests waiting for administrator action" status={{ status: model.pendingApprovals ? "pending" : "completed" }} actionLabel="Review queue" onAction={() => navigate("/tickets")} />
        <StatCard title="Active Assets" value={model.activeAssetCount} detail={`${model.activeAssetPercentage}% of ${model.assets.total} registered assets`} actionLabel="View assets" onAction={() => navigate("/assets")} />
        <StatCard title="Network Status" value={networkValue} detail={model.network.available ? `${model.network.offline} offline of ${model.network.total}` : "Telemetry is not included in the dashboard feed"} status={model.network.available ? { status: model.network.offline ? "offline" : "online" } : { label: "Not reported", tone: "neutral" }} actionLabel="View network" disabled={!canViewNetwork} onAction={() => navigate("/network-monitoring")} />
        <StatCard title="Inventory Alerts" value={model.inventory.lowStockCount} detail="Items at or below minimum stock level" status={{ status: model.inventory.lowStockCount ? "low_stock" : "completed" }} actionLabel="View inventory" disabled={!canViewInventory} onAction={() => navigate("/inventory")} />
      </div>
    </section>
  );
}
