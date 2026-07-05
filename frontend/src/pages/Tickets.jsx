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
  const [actionTicket, setActionTicket] = useState(null);
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
  const [actionLoading, setActionLoading] = useState(false);

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

  const openActionDialog = (ticket) => {
    setError("");
    setSuccess("");
    setActionTicket(ticket);
  };

  const handleViewEvidence = async (ticketId, attachmentId) => {
    setError("");
    setActionLoading(true);

    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setError("Popup blocked. Please allow popups to view evidence.");
      setActionLoading(false);
      return;
    }

    previewWindow.opener = null;

    try {
      const token = localStorage.getItem("token");
      const response = await API.get(
        `/tickets/${ticketId}/attachments/${attachmentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || response.data.type,
      });
      const url = window.URL.createObjectURL(blob);

      previewWindow.location.href = url;
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      previewWindow.close();
      setError(err.response?.data?.message || "Failed to open evidence");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadEvidence = async (ticketId, attachmentId, originalName) => {
    setError("");
    setActionLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await API.get(
        `/tickets/${ticketId}/attachments/${attachmentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download evidence");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async (ticket) => {
    if (!window.confirm(`Delete ${ticket.ticketId}? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/tickets/${ticket._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets((currentTickets) => currentTickets.filter((item) => item._id !== ticket._id));
      setSelectedTicketId((currentId) => (currentId === ticket._id ? "" : currentId));
      setActionTicket(null);
      setSuccess(`${ticket.ticketId} deleted successfully`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete request");
    } finally {
      setActionLoading(false);
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

      <section className="filter-panel">
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
        <section className="workflow-panel">
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

      <WorkflowStrip />

      <DataTable
        metric={`${filteredTickets.length} records`}
        emptyLabel="Hardware Requests"
        columns={["Request", "Requester", "Type", "Priority", "Status", "Fulfillment", "Evidence", "Action"]}
      >
        {filteredTickets.length === 0 ? (
          <EmptyRow colSpan="8" message="No hardware requests found" />
        ) : (
          filteredTickets.map((ticket) => (
            <tr key={ticket._id} onClick={() => openActionDialog(ticket)} className="cursor-pointer hover:bg-slate-50">
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
              <td className="min-w-32">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openActionDialog(ticket);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  Options
                </button>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {actionTicket && (
        <TicketActionDialog
          ticket={actionTicket}
          user={user}
          actionLoading={actionLoading}
          onClose={() => setActionTicket(null)}
          onViewDetails={() => navigate(`/tickets/${actionTicket._id}`)}
          onEdit={() => navigate(`/tickets/${actionTicket._id}?action=edit`)}
          onDelete={() => handleDeleteTicket(actionTicket)}
          onViewEvidence={handleViewEvidence}
          onDownloadEvidence={handleDownloadEvidence}
        />
      )}
    </Layout>
  );
}

function WorkflowStrip() {
  return (
    <div className="workflow-strip" aria-label="Hardware request workflow">
      <span className="workflow-step is-active" style={{ "--step": "#efb94e" }}>Submitted</span>
      <span className="workflow-step" style={{ "--step": "#7b8fcf" }}>Review</span>
      <span className="workflow-step" style={{ "--step": "#df6e75" }}>Procurement</span>
      <span className="workflow-step" style={{ "--step": "#44b88a" }}>Available</span>
      <span className="workflow-step" style={{ "--step": "#344a86" }}>Closed</span>
    </div>
  );
}

function TicketActionDialog({
  ticket,
  user,
  actionLoading,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
  onViewEvidence,
  onDownloadEvidence,
}) {
  const canManageRequest = canManageOwnRequest(ticket, user);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-start">
          <div>
            <p className="page-eyebrow mb-1">Request options</p>
            <h3 className="text-xl font-black text-slate-950">{ticket.ticketId}</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{ticket.issueDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-lg border border-slate-200 text-lg font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close request options"
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">Request Actions</p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={onViewDetails}
                className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
              >
                View Full Details
              </button>

              {canManageRequest ? (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    disabled={actionLoading}
                    className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Update Request
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={actionLoading}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ? "Deleting..." : "Delete Request"}
                  </button>
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
                  Update and delete are available only to the requester while the request is submitted.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-sm font-black text-slate-950">Uploaded Evidence</p>
                <p className="text-xs font-semibold text-slate-500">
                  {ticket.attachments?.length || 0} file(s) attached
                </p>
              </div>
              <Badge tone={statusTone(ticket.status)}>{formatLabel(ticket.status)}</Badge>
            </div>

            {ticket.attachments?.length > 0 ? (
              <div className="space-y-3">
                {ticket.attachments.map((attachment) => (
                  <div key={attachment._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-slate-500">
                        {getFileKind(attachment.mimeType)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900">{attachment.originalName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {formatFileSize(attachment.size)} | {formatDate(attachment.uploadedAt || attachment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onViewEvidence(ticket._id, attachment._id)}
                        disabled={actionLoading}
                        className="rounded-md bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadEvidence(ticket._id, attachment._id, attachment.originalName)}
                        disabled={actionLoading}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                No evidence files uploaded for this request.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
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

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function getFileKind(mimeType = "") {
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.startsWith("video/")) return "VID";
  if (mimeType.includes("pdf")) return "PDF";
  return "FILE";
}

function getUserId(user = {}) {
  return user.id || user._id || "";
}

function getPersonId(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person._id || person.id || "";
}

function canManageOwnRequest(ticket, user) {
  const userId = getUserId(user);
  const creatorId = getPersonId(ticket?.createdBy);

  return Boolean(
    userId &&
      creatorId === userId &&
      ["draft", "submitted"].includes(ticket?.status)
  );
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
