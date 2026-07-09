import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { enumLabel, formatDate, formatDateTime, t } = useTranslation();
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
            setError(t("ticketDetail.cannotAction", {
              action: requestedAction === "edit" ? t("common.updateRequest") : t("common.deleteRequest"),
            }));
          }

          setSearchParams({}, { replace: true });
        }
      } catch (err) {
        setError(err.response?.data?.message || t("ticketDetail.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, setSearchParams, t]);

  const canEdit = canManageOwnRequest(ticket, user);
  const canDelete = canEdit;

  const handleViewEvidence = async (attachmentId) => {
    setError("");
    setActionLoading(true);

    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setError(t("tickets.popupBlocked"));
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
      setError(err.response?.data?.message || t("ticketDetail.openEvidenceError"));
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
      setError(err.response?.data?.message || t("ticketDetail.downloadFileError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvidence = async (attachmentId) => {
    if (!window.confirm(t("ticketDetail.deleteEvidenceConfirm"))) {
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
      setSuccess(t("ticketDetail.evidenceDeleted"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t("ticketDetail.deleteFileError"));
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
      setSuccess(t("ticketDetail.ticketUpdated"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t("ticketDetail.updateError"));
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
      setError(err.response?.data?.message || t("ticketDetail.deleteError"));
      setShowDeleteConfirm(false);
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader eyebrow={t("ticketDetail.loadingEyebrow")} title={t("ticketDetail.title")} />
        <div className="py-8 text-center">{t("common.loading")}</div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <PageHeader eyebrow={t("ticketDetail.errorEyebrow")} title={t("ticketDetail.title")} />
        <Alert message={error || t("ticketDetail.notFound")} />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        eyebrow={t("ticketDetail.eyebrow")}
        title={t("ticketDetail.titleWithId", { ticketId: ticket.ticketId })}
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
                <p className="page-eyebrow mb-1">{t("labels.requestDetails")}</p>
                <h3 className="text-lg font-black text-slate-950">{ticket.ticketId}</h3>
              </div>
              <Badge tone={statusTone(ticket.status)}>{enumLabel("status", ticket.status)}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <DetailItem label={t("labels.requestType")} value={enumLabel("requestType", ticket.requestType)} />
              <DetailItem label={t("labels.hardwareCategory")} value={enumLabel("hardwareCategory", ticket.hardwareCategory)} />
              <DetailItem label={t("labels.priority")} value={enumLabel("priority", ticket.priority)} />
              <DetailItem label={t("labels.department")} value={ticket.department || t("common.notAvailable")} />
              <DetailItem label={t("labels.issueDescription")} value={ticket.issueDescription} wide />
              {ticket.businessImpact && <DetailItem label={t("labels.businessImpact")} value={ticket.businessImpact} wide />}
              {ticket.requestedSpecification && (
                <DetailItem label={t("labels.requestedSpecification")} value={ticket.requestedSpecification} wide />
              )}
              {ticket.remarks && <DetailItem label={t("labels.remarks")} value={ticket.remarks} wide />}
            </div>
          </section>

          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">{t("labels.requesterInformation")}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <DetailItem label={t("labels.name")} value={ticket.requesterProfile?.name || ticket.createdBy?.name || t("common.notAvailable")} />
              <DetailItem label={t("labels.employeeId")} value={ticket.requesterProfile?.employeeId || t("common.notAvailable")} />
              <DetailItem label={t("labels.email")} value={ticket.requesterProfile?.email || ticket.createdBy?.email || t("common.notAvailable")} />
              <DetailItem label={t("labels.department")} value={ticket.requesterProfile?.department || t("common.notAvailable")} />
            </div>
          </section>

          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">{t("labels.uploadedEvidence")} ({ticket.attachments?.length || 0})</p>
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
                          {t("common.view")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadEvidence(attachment._id, attachment.originalName)}
                        disabled={actionLoading}
                        className="rounded bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {t("common.download")}
                      </button>
                      {canDeleteAttachment(attachment, user) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvidence(attachment._id)}
                          disabled={actionLoading}
                          className="rounded bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {t("common.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-600">{t("ticketDetail.emptyEvidence")}</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">{t("labels.statusHistory")}</p>
            </div>

            {ticket.statusHistory?.length > 0 ? (
              <div className="space-y-4 text-sm">
                {ticket.statusHistory.slice().reverse().map((history, index) => (
                  <div key={history._id || index} className="border-l-2 border-slate-200 pl-4">
                    <p className="font-semibold text-slate-900">{enumLabel("status", history.newStatus)}</p>
                    {history.comment && <p className="mt-1 text-xs text-slate-600">{history.comment}</p>}
                    {history.changedBy && (
                      <p className="mt-1 text-xs text-slate-500">{t("ticketDetail.changedBy", { name: history.changedBy.name })}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">{t("ticketDetail.noStatusUpdates")}</p>
            )}
          </section>

          <section className="dashboard-panel p-6">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="page-eyebrow">{t("common.actions")}</p>
            </div>

            <div className="space-y-3">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  disabled={actionLoading}
                  className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {t("common.updateRequest")}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={actionLoading}
                  className="w-full rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {t("common.deleteRequest")}
                </button>
              )}
              {!canEdit && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                  {t("ticketDetail.updateAndDeleteNotice")}
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate("/tickets")}
                className="w-full rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-300"
              >
                {t("common.backToTickets")}
              </button>
            </div>
          </section>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-lg font-black text-slate-950">{t("ticketDetail.updateModalTitle")}</h2>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4 p-6">
              <div className="field">
                <label htmlFor="editRequestType">{t("labels.requestType")}</label>
                <select id="editRequestType" name="requestType" value={editFormData.requestType} onChange={handleEditChange}>
                  <option value="fault">{enumLabel("requestType", "fault")}</option>
                  <option value="replacement">{enumLabel("requestType", "replacement")}</option>
                  <option value="upgrade">{enumLabel("requestType", "upgrade")}</option>
                  <option value="performance_issue">{enumLabel("requestType", "performance_issue")}</option>
                  <option value="procurement">{enumLabel("requestType", "procurement")}</option>
                  <option value="other">{enumLabel("requestType", "other")}</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="editHardwareCategory">{t("labels.hardwareCategory")}</label>
                <select
                  id="editHardwareCategory"
                  name="hardwareCategory"
                  value={editFormData.hardwareCategory}
                  onChange={handleEditChange}
                >
                  <option value="monitor">{enumLabel("hardwareCategory", "monitor")}</option>
                  <option value="mouse">{enumLabel("hardwareCategory", "mouse")}</option>
                  <option value="keyboard">{enumLabel("hardwareCategory", "keyboard")}</option>
                  <option value="ram">{enumLabel("hardwareCategory", "ram")}</option>
                  <option value="storage">{enumLabel("hardwareCategory", "storage")}</option>
                  <option value="cpu">{enumLabel("hardwareCategory", "cpu")}</option>
                  <option value="printer">{enumLabel("hardwareCategory", "printer")}</option>
                  <option value="laptop_desktop">{enumLabel("hardwareCategory", "laptop_desktop")}</option>
                  <option value="network_device">{enumLabel("hardwareCategory", "network_device")}</option>
                  <option value="scanner">{enumLabel("hardwareCategory", "scanner")}</option>
                  <option value="accessories">{enumLabel("hardwareCategory", "accessories")}</option>
                  <option value="other">{enumLabel("hardwareCategory", "other")}</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="editCurrentAssetTag">{t("labels.assetTagSerial")}</label>
                <input
                  id="editCurrentAssetTag"
                  name="currentAssetTag"
                  value={editFormData.currentAssetTag}
                  onChange={handleEditChange}
                  placeholder={t("placeholders.assetTagSerial")}
                />
              </div>

              <div className="field">
                <label htmlFor="editIssueDescription">{t("labels.issueDescription")}</label>
                <textarea
                  id="editIssueDescription"
                  name="issueDescription"
                  value={editFormData.issueDescription}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="editBusinessImpact">{t("labels.businessImpact")}</label>
                <textarea
                  id="editBusinessImpact"
                  name="businessImpact"
                  value={editFormData.businessImpact}
                  onChange={handleEditChange}
                />
              </div>

              <div className="field">
                <label htmlFor="editRequestedSpecification">{t("labels.requestedSpecification")}</label>
                <input
                  id="editRequestedSpecification"
                  name="requestedSpecification"
                  value={editFormData.requestedSpecification}
                  onChange={handleEditChange}
                />
              </div>

              <div className="field">
                <label htmlFor="editPriority">{t("labels.priority")}</label>
                <select id="editPriority" name="priority" value={editFormData.priority} onChange={handleEditChange}>
                  <option value="low">{enumLabel("priority", "low")}</option>
                  <option value="medium">{enumLabel("priority", "medium")}</option>
                  <option value="high">{enumLabel("priority", "high")}</option>
                  <option value="critical">{enumLabel("priority", "critical")}</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="editPreferredInstallationTime">{t("labels.preferredInstallationTime")}</label>
                <input
                  id="editPreferredInstallationTime"
                  type="datetime-local"
                  name="preferredInstallationTime"
                  value={editFormData.preferredInstallationTime}
                  onChange={handleEditChange}
                />
              </div>

              <div className="field">
                <label htmlFor="editRemarks">{t("labels.remarks")}</label>
                <textarea id="editRemarks" name="remarks" value={editFormData.remarks} onChange={handleEditChange} />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-300"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? t("common.saving") : t("common.saveChanges")}
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
              <h2 className="text-lg font-black text-slate-950">{t("ticketDetail.deleteModalTitle")}</h2>
            </div>

            <div className="p-6">
              <p className="mb-4 text-sm text-slate-700">
                {t("ticketDetail.deleteModalDescription")}
              </p>
              <p className="mb-6 text-xs text-slate-600">{t("ticketDetail.ticketId", { ticketId: ticket.ticketId })}</p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionLoading}
                  className="flex-1 rounded bg-slate-200 px-4 py-2 font-semibold text-slate-900 hover:bg-slate-300 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  disabled={actionLoading}
                  className="flex-1 rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? t("common.deleting") : t("common.delete")}
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
