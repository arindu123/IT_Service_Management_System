import { Card, CardHeader, CardBody, StatusBadge } from "../../design-system";

export default function AssetSummary({ conditions, total }) {
  return (
    <Card>
      <CardHeader title="Asset condition summary" description={`${total} tracked asset(s)`} />
      <CardBody>
        <dl className="dashboard-definition-list">
          {conditions.map((condition) => (
            <div key={condition.label}><dt><StatusBadge status={condition.status} label={condition.label} /></dt><dd>{condition.value}</dd></div>
          ))}
        </dl>
      </CardBody>
    </Card>
  );
}
