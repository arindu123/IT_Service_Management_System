import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, PageHeader } from "../components/ui";

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    requestType: "",
    hardwareCategory: "",
    currentAssetTag: "",
    issueDescription: "",
    businessImpact: "",
    requestedSpecification: "",
    priority: "medium",
    preferredInstallationTime: "",
    remarks: "",
  });

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await API.get(`/tickets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setTicket(response.data);
        setEditFormData({
          requestType: response.data.requestType,
          hardwareCategory: response.data.hardwareCategory,
          currentAssetTag: response.data.currentAssetTag || "",
          issueDescription: response.data.issueDescription,
          businessImpact: response.data.businessImpact || "",
          requestedSpecification: response.data.requestedSpecification || "",
          priority: response.data.priority,
          preferredInstallationTime: response.data.preferredInstallationTime
            ? new Date(response.data.preferredInstallationTime).toISOString().slice(0, 16)
            : "",
          remarks: response.data.remarks || "",
        });

        const requestedAction = new URLSearchParams(window.location.search).get("action");

        if (["edit", "delete"].includes(requestedAction)) {
          const currentUser = JSON.parse(localStorage.getItem("user")) || {};
          const canManageFetchedTicket = canManageOwnRequest(response.data, currentUser);

          if (requestedAction === "edit" && canManageFetchedTicket) {
            setShowEditModal(true);
          } else if (requestedAction === "delete" && canManageFetchedTicket) {
            setShowDeleteConfirm(true);
          } else {
            setError(`This request can no longer be ${requestedAction === "edit" ? "updated" : "deleted"}.`);
          }

          setSearchParams({}, { replace: true });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, setSearchParams]);

  const canEdit = canManageOwnRequest(ticket, user);
  const canDelete = canEdit;

  const handleViewEvidence = async (attachmentId) => {
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
      const response = await API.get(`/tickets/${id}/attachments/${attachmentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

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

  const handleDownloadEvidence = async (attachmentId, originalName) => {
    setError("");
    setActionLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await API.get(`/tickets/${id}/attachments/${attachmentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download file");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvidence = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this evidence file?")) {
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await API.delete(`/tickets/${id}/attachments/${attachmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTicket(response.data.ticket);
      setSuccess("Evidence file deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete file");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await API.put(`/tickets/${id}/update`, editFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTicket(response.data.ticket);
      setShowEditModal(false);
      setSuccess("Ticket updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update ticket");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    setActionLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete ticket");
      setShowDeleteConfirm(false);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader eyebrow="Loading" title="Ticket Details" />
        <div className="py-8 text-center">Loading...</div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <PageHeader eyebrow="Error" title="Ticket Details" />
        <Alert message={error || "Ticket not found"} />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="IT helpdesk workflow"
        title={`${ticket.ticketId} - Ticket Details`}
        description={ticket.issueDescription}
      />

      <Alert message={error} />
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="dashboard-panel p-6">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="page-eyebrow mb-1">Request Details</p>
                <h3 className="text-lg font-black text-slate-950">{ticket.ticketId}</h3>
              </div>
              <Badge tone={statusTone(ticket.status)}>{formatLabel(ticket.status)}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <DetailItem label="Request Type" value={formatLabel(ticket.requestType)} />
              <DetailItem label="Hardware Category" value={formatLabel(ticket.hardwareCategory)} />
              <DetailItem label="Priority" value={formatLabel(ticket.priority)} />
              <DetailItem label="Department" value={ticket.department || "N/A"} />
              <DetailItem label="Issue Description" value={ticket.issueDescription} wide />
              {ticket.businessImpact && <DetailItem label="Business Impact" value={ticket.businessImpact} wide />}
              {ticket.requestedSpecification && (
                <DetailItem label="Requested Specification" value={ticket.requestedSpecification} wide />
              )}
              {ticket.remarks && <DetailItem label="Remarks" value={ticket.remarks} wide />}
            </div>
          </section>

          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">Requester Information</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <DetailItem label="Name" value={ticket.requesterProfile?.name || ticket.createdBy?.name || "N/A"} />
              <DetailItem label="Employee ID" value={ticket.requesterProfile?.employeeId || "N/A"} />
              <DetailItem label="Email" value={ticket.requesterProfile?.email || ticket.createdBy?.email || "N/A"} />
              <DetailItem label="Department" value={ticket.requesterProfile?.department || "N/A"} />
            </div>
          </section>

          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">Uploaded Evidence ({ticket.attachments?.length || 0})</p>
            </div>

            {ticket.attachments?.length > 0 ? (
              <div className="space-y-3">
                {ticket.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-md bg-white text-xs font-black text-slate-500">
                        {getFileKind(attachment.mimeType)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{attachment.originalName}</p>
                        <p className="text-xs text-slate-600">
                          {formatFileSize(attachment.size)} | {formatDate(attachment.uploadedAt || attachment.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleViewEvidence(attachment._id)}
                        disabled={actionLoading}
                        className="rounded bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadEvidence(attachment._id, attachment.originalName)}
                        disabled={actionLoading}
                        className="rounded bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                      >
                        Download
                      </button>
                      {canDeleteAttachment(attachment, user) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvidence(attachment._id)}
                          disabled={actionLoading}
                          className="rounded bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-600">No evidence files uploaded yet</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">Status History</p>
            </div>

            {ticket.statusHistory?.length > 0 ? (
              <div className="space-y-4 text-sm">
                {ticket.statusHistory.slice().reverse().map((history, index) => (
                  <div key={history._id || index} className="border-l-2 border-slate-200 pl-4">
                    <p className="font-semibold text-slate-900">{formatLabel(history.newStatus)}</p>
                    {history.comment && <p className="mt-1 text-xs text-slate-600">{history.comment}</p>}
                    {history.changedBy && (
                      <p className="mt-1 text-xs text-slate-500">by {history.changedBy.name}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No status updates yet</p>
            )}
          </section>

          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">Actions</p>
            </div>

            <div className="space-y-3">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  disabled={actionLoading}
                  className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Update Request
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={actionLoading}
                  className="w-full rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Delete Request
                </button>
              )}
              {!canEdit && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                  Update and delete are available only to the requester while the request is submitted.
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate("/tickets")}
                className="w-full rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-300"
              >
                Back to Tickets
              </button>
            </div>
          </section>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-lg font-black text-slate-950">Update Request</h2>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4 p-6">
              <div className="field">
                <label htmlFor="editRequestType">Request Type</label>
                <select id="editRequestType" name="requestType" value={editFormData.requestType} onChange={handleEditChange}>
                  <option value="fault">Fault</option>
                  <option value="replacement">Replacement</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="performance_issue">Performance Issue</option>
                  <option value="procurement">Procurement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="editHardwareCategory">Hardware Category</label>
                <select
                  id="editHardwareCategory"
                  name="hardwareCategory"
                  value={editFormData.hardwareCategory}
                  onChange={handleEditChange}
                >
                  <option value="monitor">Monitor</option>
                  <option value="mouse">Mouse</option>
                  <option value="keyboard">Keyboard</option>
                  <option value="ram">RAM</option>
                  <option value="storage">Storage</option>
                  <option value="cpu">CPU</option>
                  <option value="printer">Printer</option>
                  <option value="laptop_desktop">Laptop / Desktop</option>
                  <option value="network_device">Network Device</option>
                  <option value="scanner">Scanner</option>
                  <option value="accessories">Accessories</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="editCurrentAssetTag">Asset Tag / Serial</label>
                <input
                  id="editCurrentAssetTag"
                  name="currentAssetTag"
                  value={editFormData.currentAssetTag}
                  onChange={handleEditChange}
                  placeholder="Asset tag or serial number"
                />
              </div>

              <div className="field">
                <label htmlFor="editIssueDescription">Issue Description</label>
                <textarea
                  id="editIssueDescription"
                  name="issueDescription"
                  value={editFormData.issueDescription}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="editBusinessImpact">Business Impact</label>
                <textarea
                  id="editBusinessImpact"
                  name="businessImpact"
                  value={editFormData.businessImpact}
                  onChange={handleEditChange}
                />
              </div>

              <div className="field">
                <label htmlFor="editRequestedSpecification">Requested Specification</label>
                <input
                  id="editRequestedSpecification"
                  name="requestedSpecification"
                  value={editFormData.requestedSpecification}
                  onChange={handleEditChange}
                />
              </div>

              <div className="field">
                <label htmlFor="editPriority">Priority</label>
                <select id="editPriority" name="priority" value={editFormData.priority} onChange={handleEditChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="editPreferredInstallationTime">Preferred Installation Time</label>
                <input
                  id="editPreferredInstallationTime"
                  type="datetime-local"
                  name="preferredInstallationTime"
                  value={editFormData.preferredInstallationTime}
                  onChange={handleEditChange}
                />
              </div>

              <div className="field">
                <label htmlFor="editRemarks">Remarks</label>
                <textarea id="editRemarks" name="remarks" value={editFormData.remarks} onChange={handleEditChange} />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-lg font-black text-slate-950">Delete Request?</h2>
            </div>

            <div className="p-6">
              <p className="mb-4 text-sm text-slate-700">
                Are you sure you want to delete this request? This action cannot be undone.
              </p>
              <p className="mb-6 text-xs text-slate-600">Ticket ID: {ticket.ticketId}</p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                  className="flex-1 rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  disabled={actionLoading}
                  className="flex-1 rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</label>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
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

function statusTone(status) {
  if (["rejected", "cancelled"].includes(status)) return "red";
  if (["procurement_required", "in_procurement", "installation_scheduled"].includes(status)) return "amber";
  if (["installed", "closed", "item_available"].includes(status)) return "green";
  if (["acknowledged", "technician_assigned", "under_review"].includes(status)) return "violet";
  if (["submitted", "need_more_information", "inventory_check"].includes(status)) return "blue";
  return "slate";
}

function getUserId(user = {}) {
  return user.id || user._id || "";
}

function getPersonId(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person._id || person.id || "";
}

function canDeleteAttachment(attachment, user) {
  const userId = getUserId(user);
  const uploadedById = getPersonId(attachment?.uploadedBy);

  return Boolean(userId && (uploadedById === userId || ["admin", "system_admin"].includes(user.role)));
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

export default TicketDetail;
