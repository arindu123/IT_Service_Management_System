import { Button, Card, CardBody, StatusBadge } from "../../design-system";

export default function StatCard({ title, value, detail, status, actionLabel, onAction, disabled = false }) {
  return (
    <Card className="dashboard-stat-card">
      <CardBody>
        <div className="dashboard-stat-heading">
          <h2>{title}</h2>
          {status && <StatusBadge {...status} />}
        </div>
        <strong className="dashboard-stat-value">{value}</strong>
        <p>{detail}</p>
        {actionLabel && <Button variant="ghost" disabled={disabled} onClick={onAction}>{actionLabel}</Button>}
      </CardBody>
    </Card>
  );
}
