import { Card, CardHeader, CardBody, TableEmptyState, StatusBadge } from "../../design-system";

export default function ActivityTimeline({ activities, formatDateTime }) {
  return (
    <Card>
      <CardHeader title="Recent activity" description="Latest operational events reported to the dashboard." />
      <CardBody>
        {activities.length === 0 ? (
          <TableEmptyState title="No recent activity in the dashboard feed" description="Activity will appear here when it is supplied by the existing summary data source." />
        ) : (
          <ol className="dashboard-timeline">
            {activities.map((activity, index) => (
              <li key={activity._id || `${activity.type}-${index}`}>
                <span className="dashboard-timeline-marker" aria-hidden="true" />
                <div><strong>{activity.title || activity.type || "System activity"}</strong><p>{activity.description || "No additional details"}</p></div>
                <div><StatusBadge status={activity.status} /><time dateTime={activity.createdAt}>{formatDateTime(activity.createdAt)}</time></div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
