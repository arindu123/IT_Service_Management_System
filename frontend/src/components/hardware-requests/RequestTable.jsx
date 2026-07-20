import { Button, DataTable } from "../../design-system";
import RequestStatus, { PriorityBadge } from "./RequestStatus";
import RequestCard from "./RequestCard";
import { assignedOfficer } from "./requestConstants";
import { useTranslation } from "../../i18n/LanguageContext";

const columns = [
  { key: "ticketId", header: "requestPage.requestId" },
  { key: "requester", header: "requestPage.requester" },
  { key: "requestType", header: "requestPage.requestType" },
  { key: "priority", header: "requestPage.priority" },
  { key: "status", header: "requestPage.status" },
  { key: "createdAt", header: "requestPage.submittedDate" },
  { key: "assigned", header: "requestPage.assignedOfficer" },
  { key: "actions", header: "requestPage.actions" }
];

export default function RequestTable({ requests, loading, enumLabel, formatDate, canManage, canDelete, onOpen, onManage, onDelete }) {
  const { t } = useTranslation();

  const translatedColumns = columns.map(col => ({
    ...col,
    header: t(col.header)
  }));

  const cell = (request, column) => {
    if (column.key === "requester") return <><strong>{request.requesterProfile?.name || request.createdBy?.name || t('common.requester')}</strong><small className="request-cell-meta">{request.requesterProfile?.employeeId || request.department}</small></>;
    if (column.key === "requestType") return enumLabel("requestType", request.requestType);
    if (column.key === "priority") return <PriorityBadge priority={request.priority} enumLabel={enumLabel} />;
    if (column.key === "status") return <RequestStatus status={request.status} enumLabel={enumLabel} />;
    if (column.key === "createdAt") return formatDate(request.createdAt);
    if (column.key === "assigned") return assignedOfficer(request);
    if (column.key === "actions") return <div className="request-row-actions"><Button variant="ghost" onClick={() => onOpen(request)}>{t('ui.view')}</Button>{canManage && <Button variant="secondary" onClick={() => onManage(request)}>{t('requestPage.actionsTitle')}</Button>}{canDelete(request) && <Button variant="danger" onClick={() => onDelete(request)}>{t('common.delete')}</Button>}</div>;
    return request[column.key] || "—";
  };

  return (
    <>
      <div className="request-table-desktop">
        <DataTable
          columns={translatedColumns}
          data={requests}
          loading={loading}
          rowKey="_id"
          caption={t('requestPage.hardwareRequests')}
          emptyTitle={t('requestPage.noHardwareRequests')}
          emptyDescription={t('requestPage.adjustFiltersOrAdd')}
          renderCell={cell}
        />
      </div>
      <div className="request-card-list">
        {!loading && requests.map((request) => (
          <RequestCard
            key={request._id}
            request={request}
            enumLabel={enumLabel}
            formatDate={formatDate}
            onOpen={onOpen}
            onManage={canManage ? onManage : null}
            onDelete={canDelete(request) ? onDelete : null}
          />
        ))}
        {!loading && !requests.length && <p className="request-empty">{t('requestPage.noHardwareRequests')}</p>}
      </div>
    </>
  );
}
