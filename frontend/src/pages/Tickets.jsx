import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";

const statusOptions = [
  "submitted",
  "acknowledged",
  "need_more_information",
  "under_review",
  "technician_assigned",
  "inventory_check",
  "procurement_required",
  "in_procurement",
  "item_available",
  "installation_scheduled",
  "installed",
  "closed",
  "rejected",
  "cancelled",
];

const updateRoles = [
  "admin",
  "system_admin",
  "head_of_it",
  "technician",
  "store_keeper",
  "procurement_officer",
];

function Tickets() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canUpdateWorkflow = updateRoles.includes(user.role);

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [filters, setFilters] = useState({ keyword: "", status: "" });
  const [statusForm, setStatusForm] = useState({
    status: "acknowledged",
    expectedFulfillmentDate: "",
    itemAvailability: "",
    procurementStatus: "",
    installationSchedule: "",
    nextAction: "",
    remarks: "",
    comment: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/tickets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTickets(response.data.tickets);
        if (response.data.tickets.length > 0) {
          setSelectedTicketId(response.data.tickets[0]._id);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load requests");
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const searchable = [
        ticket.ticketId,
        ticket.issueDescription,
        ticket.department,
        ticket.requesterProfile?.name,
        ticket.requesterProfile?.employeeId,
        ticket.hardwareCategory,
        ticket.requestType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !keyword || searchable.includes(keyword);
      const matchesStatus = !filters.status || ticket.status === filters.status;

      return matchesKeyword && matchesStatus;
    });
  }, [filters, tickets]);

  const selectedTicket = tickets.find((ticket) => ticket._id === selectedTicketId);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleStatusFormChange = (e) => {
    setStatusForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!selectedTicketId) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await API.put(`/tickets/${selectedTicketId}/status`, statusForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets((prev) =>
        prev.map((ticket) => (ticket._id === response.data.ticket._id ? response.data.ticket : ticket))
      );
      setSuccess(`${response.data.ticket.ticketId} updated successfully`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="IT helpdesk workflow"
        title="Hardware Requests"
        description="Track hardware issues, upgrades, procurement progress, availability and installation closure."
        action={<Button onClick={() => navigate("/tickets/create")}>New Request</Button>}
      />

      <Alert message={error} />
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
          <div className="field">
            <label htmlFor="keyword">Search Requests</label>
            <input
              id="keyword"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Ticket, requester, employee ID, department or hardware"
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {canUpdateWorkflow && (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
          <div className="mb-4 border-b border-slate-100 pb-4">
            <p className="page-eyebrow mb-1">Fulfillment control</p>
            <h3 className="text-lg font-black text-slate-950">Workflow Update</h3>
          </div>

          <form onSubmit={handleUpdateStatus} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="field">
              <label htmlFor="selectedTicketId">Request</label>
              <select
                id="selectedTicketId"
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
              >
                {tickets.map((ticket) => (
                  <option key={ticket._id} value={ticket._id}>
                    {ticket.ticketId} - {ticket.requesterProfile?.name || ticket.createdBy?.name || "Requester"}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="workflowStatus">Status</label>
              <select
                id="workflowStatus"
                name="status"
                value={statusForm.status}
                onChange={handleStatusFormChange}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="expectedFulfillmentDate">Expected Fulfillment</label>
              <input
                id="expectedFulfillmentDate"
                type="date"
                name="expectedFulfillmentDate"
                value={statusForm.expectedFulfillmentDate}
                onChange={handleStatusFormChange}
              />
            </div>

            <div className="field">
              <label htmlFor="itemAvailability">Item Availability</label>
              <select
                id="itemAvailability"
                name="itemAvailability"
                value={statusForm.itemAvailability}
                onChange={handleStatusFormChange}
              >
                <option value="">Not updated</option>
                <option value="stock_check_pending">Stock Check Pending</option>
                <option value="available_in_stock">Available in Stock</option>
                <option value="reserved">Reserved</option>
                <option value="procurement_required">Procurement Required</option>
                <option value="received">Received</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="procurementStatus">Procurement Status</label>
              <select
                id="procurementStatus"
                name="procurementStatus"
                value={statusForm.procurementStatus}
                onChange={handleStatusFormChange}
              >
                <option value="">Not updated</option>
                <option value="not_required">Not Required</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="installationSchedule">Installation Schedule</label>
              <input
                id="installationSchedule"
                type="datetime-local"
                name="installationSchedule"
                value={statusForm.installationSchedule}
                onChange={handleStatusFormChange}
              />
            </div>

            <div className="field lg:col-span-3">
              <label htmlFor="nextAction">Next Action</label>
              <input
                id="nextAction"
                name="nextAction"
                value={statusForm.nextAction}
                onChange={handleStatusFormChange}
                placeholder="Next action visible to requester"
              />
            </div>

            <div className="field lg:col-span-3">
              <label htmlFor="remarks">Remarks / Timeline Comment</label>
              <textarea
                id="remarks"
                name="remarks"
                value={statusForm.remarks}
                onChange={handleStatusFormChange}
                placeholder="Approval, procurement, availability or installation note"
                rows="3"
              />
            </div>

            <div className="lg:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SelectedSummary ticket={selectedTicket} />
              <Button type="submit" disabled={loading || !selectedTicketId}>
                {loading ? "Updating..." : "Update Workflow"}
              </Button>
            </div>
          </form>
        </section>
      )}

      <DataTable
        metric={`${filteredTickets.length} records`}
        emptyLabel="Hardware Requests"
        columns={["Request", "Requester", "Type", "Priority", "Status", "Fulfillment", "Evidence"]}
      >
        {filteredTickets.length === 0 ? (
          <EmptyRow colSpan="7" message="No hardware requests found" />
        ) : (
          filteredTickets.map((ticket) => (
            <tr key={ticket._id} onClick={() => navigate(`/tickets/${ticket._id}`)} className="cursor-pointer hover:bg-slate-50">
              <td className="min-w-44">
                <div className="font-black text-blue-600 hover:underline">{ticket.ticketId}</div>
                <div className="text-xs font-semibold text-slate-500">
                  {formatDate(ticket.createdAt)}
                </div>
              </td>
              <td className="min-w-52">
                <div className="font-bold text-slate-800">
                  {ticket.requesterProfile?.name || ticket.createdBy?.name || "Requester"}
                </div>
                <div className="text-xs text-slate-500">
                  {ticket.requesterProfile?.employeeId || "No employee ID"} | {ticket.department}
                </div>
              </td>
              <td className="min-w-56">
                <div className="font-semibold text-slate-800">{formatLabel(ticket.requestType)}</div>
                <div className="text-xs text-slate-500">
                  {formatLabel(ticket.hardwareCategory)} {ticket.currentAssetTag ? `| ${ticket.currentAssetTag}` : ""}
                </div>
              </td>
              <td>
                <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
              </td>
              <td>
                <Badge tone={statusTone(ticket.status)}>{formatLabel(ticket.status)}</Badge>
              </td>
              <td className="min-w-64">
                <div className="font-semibold text-slate-800">
                  {ticket.expectedFulfillmentDate
                    ? `Expected ${formatDate(ticket.expectedFulfillmentDate)}`
                    : "Date pending"}
                </div>
                <div className="max-w-xs truncate text-xs text-slate-500">
                  {ticket.nextAction || ticket.issueDescription}
                </div>
              </td>
              <td>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {ticket.attachments?.length || 0} file(s)
                </span>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </Layout>
  );
}

function SelectedSummary({ ticket }) {
  if (!ticket) {
    return <p className="text-sm font-semibold text-slate-500">Select a request to update.</p>;
  }

  return (
    <div className="text-sm text-slate-600">
      <span className="font-black text-slate-900">{formatLabel(ticket.status)}</span>
      <span> | </span>
      <span>{ticket.nextAction || "No next action recorded"}</span>
    </div>
  );
}

function formatLabel(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function priorityTone(priority) {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "blue";
  return "green";
}

function statusTone(status) {
  if (["rejected", "cancelled"].includes(status)) return "red";
  if (["procurement_required", "in_procurement", "installation_scheduled"].includes(status)) return "amber";
  if (["installed", "closed", "item_available"].includes(status)) return "green";
  if (["acknowledged", "technician_assigned", "under_review"].includes(status)) return "violet";
  if (["submitted", "need_more_information", "inventory_check"].includes(status)) return "blue";
  return "slate";
}

export default Tickets;
