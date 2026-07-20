import { Card, CardBody, CardHeader, TableEmptyState } from "../../design-system";
import RequestStatus from "./RequestStatus";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestTimeline({ history = [], enumLabel, formatDateTime }) {
  const { t } = useTranslation();
  const items = [...history].reverse();

  return (
    <Card>
      <CardHeader title={t('requestPage.workflowTimeline')} description={t('requestPage.recordedTransitions')} />
      <CardBody>
        {items.length ? (
          <ol className="request-timeline">
            {items.map((item, index) => (
              <li key={item._id || index}>
                <span aria-hidden="true" />
                <div>
                  <RequestStatus status={item.newStatus} enumLabel={enumLabel} />
                  <p>{item.comment || item.changeSummary?.join(" · ") || t('requestPage.statusUpdated')}</p>
                  <small>{item.changedBy?.name || t('common.system')} · {formatDateTime(item.changedAt)}</small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <TableEmptyState title={t('requestPage.noWorkflowUpdates')} />
        )}
      </CardBody>
    </Card>
  );
}
