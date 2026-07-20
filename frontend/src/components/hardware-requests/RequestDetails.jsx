import { Card, CardBody, CardHeader } from "../../design-system";
import RequestStatus, { PriorityBadge } from "./RequestStatus";
import { assignedOfficer } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";

export default function RequestDetails({ request, enumLabel, formatDate }) {
  const { t } = useTranslation();
  const requester = request.requesterProfile || request.createdBy || {};

  const Item = ({ label, children, wide }) => (
    <div className={wide ? "request-detail-item request-detail-item--wide" : "request-detail-item"}>
      <dt>{label}</dt>
      <dd>{children || t('requestPage.notAvailable')}</dd>
    </div>
  );

  return (
    <div className="request-details-stack">
      <Card>
        <CardHeader
          title={t('requestPage.requestSummary')}
          action={<RequestStatus status={request.status} enumLabel={enumLabel} />}
        />
        <CardBody>
          <dl className="request-detail-grid">
            <Item label={t('requestPage.requestId')}>{request.ticketId}</Item>
            <Item label={t('requestPage.requester')}>{requester.name}</Item>
            <Item label={t('requestPage.department')}>{request.department || requester.department}</Item>
            <Item label={t('requestPage.createdDate')}>{formatDate(request.createdAt)}</Item>
            <Item label={t('requestPage.priority')}><PriorityBadge priority={request.priority} enumLabel={enumLabel} /></Item>
            <Item label={t('requestPage.assignedOfficerLabel')}>{assignedOfficer(request)}</Item>
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t('requestPage.requestInformation')} />
        <CardBody>
          <dl className="request-detail-grid">
            <Item label={t('requestPage.deviceType')}>{enumLabel("hardwareCategory", request.hardwareCategory)}</Item>
            <Item label={t('requestPage.requestTypeLabel')}>{enumLabel("requestType", request.requestType)}</Item>
            <Item label={t('requestPage.assetTag')}>{request.currentAssetTag}</Item>
            <Item label={t('requestPage.requestedSpecification')}>{request.requestedSpecification}</Item>
            <Item label={t('requestPage.reasonDescription')} wide>{request.issueDescription}</Item>
            <Item label={t('requestPage.businessImpact')} wide>{request.businessImpact}</Item>
            <Item label={t('requestPage.remarks')} wide>{request.remarks}</Item>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
