import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, PageHeader } from "../components/ui";

function formatLabel(value = "") {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getFileIcon(mimeType) {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎥";
  if (mimeType.includes("pdf")) return "📄";
  return "📎";
}

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
        
        // Initialize edit form with ticket data
        setEditFormData({
          requestType: response.data.requestType,
          hardwareCategory: response.data.hardwareCategory,
          currentAssetTag: response.data.currentAssetTag,
          issueDescription: response.data.issueDescription,
          businessImpact: response.data.businessImpact || "",
          requestedSpecification: response.data.requestedSpecification || "",
          priority: response.data.priority,
          preferredInstallationTime: response.data.preferredInstallationTime
            ? new Date(response.data.preferredInstallationTime).toISOString().slice(0, 16)
            : "",
          remarks: response.data.remarks || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const canEdit = ticket && ticket.createdBy?._id === user._id && 
                  ["draft", "submitted"].includes(ticket.status);
  
  const canDelete = ticket && ticket.createdBy?._id === user._id && 
                    ["draft", "submitted"].includes(ticket.status);

  const handleDownloadEvidence = async (attachmentId, originalName) => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get(
        `/tickets/${id}/attachments/${attachmentId}/download`,
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
      setError("Failed to download file");
    }
  };

  const handleDeleteEvidence = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this evidence file?")) {
      return;
    }

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
        <div className="text-center py-8">Loading...</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info Card */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="page-eyebrow mb-1">Request Details</p>
                <h3 className="text-lg font-black text-slate-950">{ticket.ticketId}</h3>
              </div>
              <Badge text={formatLabel(ticket.status)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Request Type
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatLabel(ticket.requestType)}
                </p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Hardware Category
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatLabel(ticket.hardwareCategory)}
                </p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Priority
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatLabel(ticket.priority)}
                </p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Department
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {ticket.department || "N/A"}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Issue Description
                </label>
                <p className="mt-1 text-sm text-slate-700">{ticket.issueDescription}</p>
              </div>
              {ticket.businessImpact && (
                <div className="md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Business Impact
                  </label>
                  <p className="mt-1 text-sm text-slate-700">{ticket.businessImpact}</p>
                </div>
              )}
              {ticket.remarks && (
                <div className="md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Remarks
                  </label>
                  <p className="mt-1 text-sm text-slate-700">{ticket.remarks}</p>
                </div>
              )}
            </div>
          </section>

          {/* Requester Info Card */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">Requester Information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Name
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {ticket.requesterProfile?.name || ticket.createdBy?.name}
                </p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Employee ID
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {ticket.requesterProfile?.employeeId || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Email
                </label>
                <p className="mt-1 text-sm text-slate-700">
                  {ticket.requesterProfile?.email || ticket.createdBy?.email}
                </p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Department
                </label>
                <p className="mt-1 text-sm text-slate-700">
                  {ticket.requesterProfile?.department || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Evidence Files Section */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">Uploaded Evidence ({ticket.attachments?.length || 0})</p>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="space-y-3">
                {ticket.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">
                        {getFileIcon(attachment.mimeType)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatFileSize(attachment.size)} •{" "}
                          {new Date(attachment.uploadedAt || attachment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() =>
                          handleDownloadEvidence(attachment._id, attachment.originalName)
                        }
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 disabled:opacity-50"
                      >
                        Download
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteEvidence(attachment._id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 text-center py-4">
                No evidence files uploaded yet
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">Status History</p>
            </div>

            {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
              <div className="space-y-4 text-sm">
                {ticket.statusHistory.slice().reverse().map((history, idx) => (
                  <div key={idx} className="border-l-2 border-slate-200 pl-4">
                    <p className="font-semibold text-slate-900">
                      {formatLabel(history.newStatus)}
                    </p>
                    {history.comment && (
                      <p className="text-xs text-slate-600 mt-1">{history.comment}</p>
                    )}
                    {history.changedBy && (
                      <p className="text-xs text-slate-500 mt-1">
                        by {history.changedBy.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No status updates yet</p>
            )}
          </section>

          {/* Actions */}
          {(canEdit || canDelete) && (
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <p className="page-eyebrow">Actions</p>
              </div>

              <div className="space-y-3">
                {canEdit && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Edit Ticket
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete Ticket
                  </button>
                )}
                <button
                  onClick={() => navigate("/tickets")}
                  className="w-full px-4 py-2 rounded bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300"
                >
                  Back to Tickets
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-950">Edit Ticket</h2>
            </div>

            <form onSubmit={handleUpdateTicket} className="p-6 space-y-4">
              <div className="field">
                <label htmlFor="editRequestType">Request Type</label>
                <select
                  id="editRequestType"
                  name="requestType"
                  value={editFormData.requestType}
                  onChange={handleEditChange}
                >
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
                  <option value="mouse">Mouse</option>
                  <option value="keyboard">Keyboard</option>
                  <option value="monitor">Monitor</option>
                  <option value="cpu">CPU</option>
                  <option value="laptop">Laptop</option>
                  <option value="printer">Printer</option>
                  <option value="network">Network</option>
                  <option value="other">Other</option>
                </select>
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
                <label htmlFor="editPriority">Priority</label>
                <select
                  id="editPriority"
                  name="priority"
                  value={editFormData.priority}
                  onChange={handleEditChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="editRemarks">Remarks</label>
                <textarea
                  id="editRemarks"
                  name="remarks"
                  value={editFormData.remarks}
                  onChange={handleEditChange}
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-950">Delete Ticket?</h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-700 mb-4">
                Are you sure you want to delete this ticket? This action cannot be undone.
              </p>
              <p className="text-xs text-slate-600 mb-6">
                Ticket ID: {ticket.ticketId}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 rounded bg-slate-200 text-slate-900 font-semibold hover:bg-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTicket}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
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

export default TicketDetail;
