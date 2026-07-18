import { Button } from "../../design-system";

export default function DashboardHeader({ lastUpdated, refreshing, onRefresh }) {
  return (
    <header className="dashboard-page-header">
      <div>
        <p className="dashboard-kicker">Operations overview</p>
        <h1>IT Service Management Dashboard</h1>
        <p>Overview of service requests, assets, inventory and infrastructure status.</p>
      </div>
      <div className="dashboard-header-actions">
        <span aria-live="polite">Last updated: {lastUpdated || "Not available"}</span>
        <Button variant="secondary" loading={refreshing} onClick={onRefresh}>Refresh</Button>
      </div>
    </header>
  );
}
