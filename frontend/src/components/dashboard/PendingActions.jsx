import { useNavigate } from "react-router-dom";
import { Button, Card, CardHeader, CardBody, DataTable, StatusBadge } from "../../design-system";

const columns = [
  { key: "ticketId", header: "Request ID" },
  { key: "employee", header: "Employee" },
  { key: "requestType", header: "Request Type" },
  { key: "priority", header: "Priority" },
  { key: "status", header: "Status" },
  { key: "submittedAt", header: "Submitted Date" },
  { key: "action", header: "Action" },
];

export default function PendingActions({ actions, pendingCount }) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader
        title="Pending administrator actions"
        description={`${pendingCount} request(s) are currently in review-stage statuses.`}
        action={<Button variant="secondary" onClick={() => navigate("/tickets")}>View all</Button>}
      />
      <CardBody>
        <DataTable
          columns={columns}
          data={actions}
          rowKey={(row) => row._id || row.ticketId}
          caption="Requests awaiting administrator action"
          emptyTitle="No detailed actions in the dashboard feed"
          emptyDescription="Open Hardware Requests to review the current request queue."
          renderCell={(row, column) => renderCell(row, column, navigate)}
        />
      </CardBody>
    </Card>
  );
}

function renderCell(row, column, navigate) {
  if (column.key === "employee") return row.employee?.name || row.employeeName || "—";
  if (column.key === "priority") return <StatusBadge label={row.priority || "Not set"} tone={row.priority === "critical" ? "danger" : "neutral"} />;
  if (column.key === "status") return <StatusBadge status={row.status} />;
  if (column.key === "submittedAt") return row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "—";
  if (column.key === "action") return <Button variant="ghost" onClick={() => navigate(`/tickets/${row._id}`)}>Open</Button>;
  return row[column.key] || "—";
}
