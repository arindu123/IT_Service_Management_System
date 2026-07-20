import { useTranslation } from "../../i18n/LanguageContext";
import { Card, CardHeader, CardBody, TableEmptyState, StatusBadge } from "../../design-system";

export default function ActivityTimeline({ activities, formatDateTime }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader title={t('dashboardPage.recentActivity')} description={t('dashboardPage.latestOperationalEvents')} />
      <CardBody>
        {activities.length === 0 ? (
          <TableEmptyState title={t('dashboardPage.noRecentActivity')} description={t('dashboardPage.activityWillAppear')} />
        ) : (
          <ol className="dashboard-timeline">
            {activities.map((activity, index) => (
              <li key={activity._id || `${activity.type}-${index}`}>
                <span className="dashboard-timeline-marker" aria-hidden="true" />
                <div><strong>{activity.title || activity.type || t('dashboardPage.systemActivity')}</strong><p>{activity.description || t('dashboardPage.noAdditionalDetails')}</p></div>
                <div><StatusBadge status={activity.status} /><time dateTime={activity.createdAt}>{formatDateTime(activity.createdAt)}</time></div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
