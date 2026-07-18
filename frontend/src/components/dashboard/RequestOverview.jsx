import { Card, CardHeader, CardBody, StatusBadge } from "../../design-system";

export default function RequestOverview({ stages, total }) {
  return (
    <Card>
      <CardHeader title="Request status summary" description={`${total} registered service request(s)`} />
      <CardBody>
        <div className="dashboard-progress-list">
          {stages.map((stage) => {
            const percent = total ? Math.round((stage.value / total) * 100) : 0;
            return (
              <div className="dashboard-progress-row" key={stage.label}>
                <div><StatusBadge status={stage.status} label={stage.label} /><span>{stage.unavailable ? "Not reported" : stage.value}</span></div>
                <div className="dashboard-progress-track" role="progressbar" aria-label={stage.label} aria-valuemin="0" aria-valuemax={total || 1} aria-valuenow={stage.value}><span style={{ width: `${percent}%` }} /></div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
