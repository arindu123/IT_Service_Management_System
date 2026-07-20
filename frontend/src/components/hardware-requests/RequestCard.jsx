import { Button, Card, CardBody } from "../../design-system";
import RequestStatus, { PriorityBadge } from "./RequestStatus";
import { assignedOfficer } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestCard({ request, enumLabel, formatDate, onOpen, onManage, onDelete }) {
  const { t } = useTranslation();
  return (
    <Card className="request-mobile-card">
      <CardBody>
        <div className="request-card-top">
          <strong>{request.ticketId}</strong>
          <RequestStatus status={request.status} enumLabel={enumLabel} />
        </div>
        <h2>{enumLabel("requestType", request.requestType)}</h2>
        <p>{request.requesterProfile?.name || request.createdBy?.name || t('common.requester')} · {request.department}</p>
        <dl>
          <div>
            <dt>{t('requestPage.priority')}</dt>
            <dd><PriorityBadge priority={request.priority} enumLabel={enumLabel} /></dd>
          </div>
          <div>
            <dt>{t('requestPage.submittedDateLabel')}</dt>
            <dd>{formatDate(request.createdAt)}</dd>
          </div>
          <div>
            <dt>{t('requestPage.assignedOfficerLabel')}</dt>
            <dd>{assignedOfficer(request)}</dd>
          </div>
        </dl>
        <div className="request-card-actions">
          <Button variant="secondary" onClick={() => onOpen(request)}>{t('ui.view')}</Button>
          {onManage && <Button variant="ghost" onClick={() => onManage(request)}>{t('requestPage.actionsTitle')}</Button>}
          {onDelete && <Button variant="danger" onClick={() => onDelete(request)}>{t('common.delete')}</Button>}
        </div>
      </CardBody>
    </Card>
  );
}
