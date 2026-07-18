import { useNavigate } from "react-router-dom";
import { Button, Card, CardHeader, CardBody, StatusBadge } from "../../design-system";

export default function NetworkSummary({ network, canView }) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader title="Network monitoring summary" description="Current infrastructure availability from the dashboard feed." />
      <CardBody>
        <dl className="dashboard-definition-list dashboard-definition-list--compact">
          <div><dt>Total devices</dt><dd>{network.available ? network.total : "—"}</dd></div>
          <div><dt><StatusBadge status="online" /></dt><dd>{network.available ? network.online : "—"}</dd></div>
          <div><dt><StatusBadge status="offline" /></dt><dd>{network.available ? network.offline : "—"}</dd></div>
          <div><dt>Last check time</dt><dd>{network.lastCheckedAt ? new Date(network.lastCheckedAt).toLocaleString() : "Not reported"}</dd></div>
        </dl>
        <div className="dashboard-card-action"><Button variant="secondary" disabled={!canView} onClick={() => navigate("/network-monitoring")}>View Network Monitoring</Button></div>
      </CardBody>
    </Card>
  );
}
