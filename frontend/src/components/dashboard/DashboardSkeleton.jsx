export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" role="status" aria-label="Loading dashboard">
      <span className="sr-only">Loading dashboard</span>
      <div className="dashboard-skeleton-alert" />
      <div className="dashboard-stats-grid">{Array.from({ length: 5 }, (_, index) => <div className="dashboard-skeleton-card" key={index} />)}</div>
      <div className="dashboard-skeleton-panel" />
      <div className="dashboard-section-grid"><div className="dashboard-skeleton-panel" /><div className="dashboard-skeleton-panel" /></div>
    </div>
  );
}
