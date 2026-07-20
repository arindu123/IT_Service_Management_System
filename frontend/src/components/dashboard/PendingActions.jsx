import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/LanguageContext";
import { Button, Card, CardHeader, CardBody, DataTable, StatusBadge } from "../../design-system";

export default function PendingActions({ actions, pendingCount }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const columns = [
    { key: "ticketId", header: t('requestPage.requestId') },
    { key: "employee", header: t('common.user') },
    { key: "requestType", header: t('requestPage.requestType') },
    { key: "priority", header: t('labels.priority') },
    { key: "status", header: t('labels.status') },
    { key: "submittedAt", header: t('requestPage.submittedDate') },
    { key: "action", header: t('common.action') },
  ];
  return (
    <Card>
      <CardHeader
        title={t('dashboardPage.pendingAdministratorActions')}
        description={`${pendingCount} ${t('dashboardPage.requestsAwaitingReview')}`}
        action={<Button variant="secondary" onClick={() => navigate("/tickets")}>{t('dashboardPage.viewAll')}</Button>}
      />
      <CardBody>
        <DataTable
          columns={columns}
          data={actions}
          rowKey={(row) => row._id || row.ticketId}
          caption={t('dashboardPage.requestsAwaitingAction')}
          emptyTitle={t('dashboardPage.noDetailedActions')}
          emptyDescription={t('dashboardPage.openHardwareRequestsToReview')}
          renderCell={(row, column) => renderCell(row, column, navigate, t)}
        />
      </CardBody>
    </Card>
  );
}

function renderCell(row, column, navigate, t) {
  if (column.key === "employee") return row.employee?.name || row.employeeName || "—";
  if (column.key === "priority") return <StatusBadge label={row.priority || t('ui.notSet')} tone={row.priority === "critical" ? "danger" : "neutral"} />;
  if (column.key === "status") return <StatusBadge status={row.status} />;
  if (column.key === "submittedAt") return row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "—";
  if (column.key === "action") return <Button variant="ghost" onClick={() => navigate(`/tickets/${row._id}`)}>{t('ui.open')}</Button>;
  return row[column.key] || "—";
}
