import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

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

function buildWorkflowStages(t) {
  return [
    {
      key: "submitted",
      label: t("tickets.workflow.submitted"),
      statuses: ["submitted"],
      color: "#efb94e",
      updateStatus: "submitted",
      nextAction: t("tickets.workflow.submittedNext"),
    },
    {
      key: "review",
      label: t("tickets.workflow.review"),
      statuses: ["acknowledged", "need_more_information", "under_review", "technician_assigned", "inventory_check"],
      color: "#7b8fcf",
      updateStatus: "under_review",
      nextAction: t("tickets.workflow.reviewNext"),
    },
    {
      key: "procurement",
      label: t("tickets.workflow.procurement"),
      statuses: ["procurement_required", "in_procurement"],
      color: "#df6e75",
      updateStatus: "procurement_required",
      itemAvailability: "procurement_required",
      procurementStatus: "requested",
      nextAction: t("tickets.workflow.procurementNext"),
    },
    {
      key: "available",
      label: t("tickets.workflow.available"),
      statuses: ["item_available", "installation_scheduled", "installed"],
      color: "#44b88a",
      updateStatus: "item_available",
      itemAvailability: "available_in_stock",
      nextAction: t("tickets.workflow.availableNext"),
    },
    {
      key: "closed",
      label: t("tickets.workflow.closed"),
      statuses: ["closed", "rejected", "cancelled"],
      color: "#344a86",
      updateStatus: "closed",
      nextAction: t("tickets.workflow.closedNext"),
    },
  ];
}

const initialStatusForm = {
  status: "acknowledged",
  expectedFulfillmentDate: "",
  itemAvailability: "",
  procurementStatus: "",
  installationSchedule: "",
  nextAction: "",
  remarks: "",
  comment: "",
};

function Tickets() {
  const navigate = useNavigate();
  const { enumLabel, formatDate, t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canUpdateWorkflow = updateRoles.includes(user.role);
  const workflowStages = useMemo(() => buildWorkflowStages(t), [t]);

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [actionTicket, setActionTicket] = useState(null);
  const [activeStage, setActiveStage] = useState("submitted");
  const [filters, setFilters] = useState({ keyword: "", status: "" });
  const [statusForm, setStatusForm] = useState(initialStatusForm);
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

        const loadedTickets = response.data.tickets;
        const visibleTickets = getFilteredTickets(loadedTickets, { keyword: "", status: "" }, "submitted", workflowStages);

        setTickets(loadedTickets);
        if (visibleTickets.length > 0) {
          setSelectedTicketId(visibleTickets[0]._id);
          setStatusForm(createStatusFormFromTicket(visibleTickets[0]));
        }
      } catch (err) {
        setError(err.response?.data?.message || t("tickets.loadError"));
      }
    };

    fetchTickets();
  }, [t, workflowStages]);

  const stageCounts = useMemo(() => {
    return workflowStages.reduce((counts, stage) => {
      counts[stage.key] = tickets.filter((ticket) => stage.statuses.includes(ticket.status)).length;
      return counts;
    }, {});
  }, [tickets, workflowStages]);

  const filteredTickets = useMemo(() => {
    return getFilteredTickets(tickets, filters, activeStage, workflowStages);
  }, [activeStage, filters, tickets, workflowStages]);

  const selectedTicket = filteredTickets.find((ticket) => ticket._id === selectedTicketId) || filteredTickets[0] || null;
  const selectedTicketValue = selectedTicket?._id || "";

  const handleFilterChange = (e) => {
    const nextFilters = {
      ...filters,
      [e.target.name]: e.target.value,
    };
    const visibleTickets = getFilteredTickets(tickets, nextFilters, activeStage, workflowStages);

    setFilters(nextFilters);
    selectTicket(visibleTickets[0] || null);
  };

  const handleStatusFormChange = (e) => {
    setStatusForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleStageChange = (stageKey) => {
    const nextFilters = { ...filters, status: "" };
    const visibleTickets = getFilteredTickets(tickets, nextFilters, stageKey, workflowStages);

    setActiveStage(stageKey);
    setFilters(nextFilters);
    selectTicket(visibleTickets[0] || null);
  };

  const selectTicket = (ticket) => {
    setSelectedTicketId(ticket?._id || "");
    setStatusForm(ticket ? createStatusFormFromTicket(ticket) : initialStatusForm);
  };

  const applyStagePreset = (stage) => {
    setStatusForm((prev) => ({
      ...prev,
      status: stage.updateStatus,
      nextAction: stage.nextAction,
      itemAvailability: stage.itemAvailability || prev.itemAvailability,
      procurementStatus: stage.procurementStatus || prev.procurementStatus,
    }));
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!selectedTicketValue) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await API.put(`/tickets/${selectedTicketValue}/status`, statusForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets((prev) =>
        prev.map((ticket) => (ticket._id === response.data.ticket._id ? response.data.ticket : ticket))
      );
      setSelectedTicketId(response.data.ticket._id);
      setStatusForm(createStatusFormFromTicket(response.data.ticket));
      setSuccess(t("tickets.updatedSuccess", { ticketId: response.data.ticket.ticketId }));
    } catch (err) {
      setError(err.response?.data?.message || t("tickets.updateError"));
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
      setError(t("tickets.popupBlocked"));
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
      setError(err.response?.data?.message || t("tickets.openEvidenceError"));
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
      setError(err.response?.data?.message || t("tickets.downloadEvidenceError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async (ticket) => {
    if (!window.confirm(t("tickets.deleteConfirm", { ticketId: ticket.ticketId }))) {
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
      setSuccess(t("tickets.deletedSuccess", { ticketId: ticket.ticketId }));
    } catch (err) {
      setError(err.response?.data?.message || t("tickets.deleteError"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("tickets.eyebrow")}
        title={t("tickets.title")}
        description={t("tickets.description")}
        action={<Button onClick={() => navigate("/tickets/create")}>{t("common.newRequest")}</Button>}
      />

      <Alert message={error} />
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <WorkflowStageTabs
        stages={workflowStages}
        activeStage={activeStage}
        counts={stageCounts}
        onChange={handleStageChange}
        ariaLabel={t("tickets.workflowAria")}
      />

      <section className="director-filter-panel">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
          <div className="field">
            <label htmlFor="keyword">{t("labels.searchRequests")}</label>
            <input
              id="keyword"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder={t("placeholders.ticketSearch")}
            />
          </div>
          <div className="field">
            <label htmlFor="status">{t("labels.detailedStatus")}</label>
            <select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">{t("tickets.allInSelectedStage")}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {enumLabel("status", status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {canUpdateWorkflow && (
        <section className="director-workbench">
          <div className="director-selected">
            <div className="flex flex-col gap-3 border-b border-[#edf1f8] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="page-eyebrow mb-1">{t("labels.selectedRequest")}</p>
                <h3 className="text-xl font-black text-[#1d2a55]">
                  {selectedTicket?.ticketId || t("tickets.noRequestSelected")}
                </h3>
              </div>
              {selectedTicket && <Badge tone={statusTone(selectedTicket.status)}>{enumLabel("status", selectedTicket.status)}</Badge>}
            </div>

            <SelectedRequestCard ticket={selectedTicket} enumLabel={enumLabel} t={t} />
          </div>

          <form onSubmit={handleUpdateStatus} className="director-update-form">
            <div className="lg:col-span-3">
              <p className="page-eyebrow mb-2">{t("labels.moveRequestTo")}</p>
              <div className="quick-stage-actions">
                {workflowStages.map((stage) => (
                  <button
                    type="button"
                    key={stage.key}
                    onClick={() => applyStagePreset(stage)}
                    className={statusForm.status === stage.updateStatus ? "is-selected" : ""}
                    style={{ "--step": stage.color }}
                    disabled={!selectedTicketValue}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="selectedTicketId">{t("labels.request")}</label>
              <select
                id="selectedTicketId"
                value={selectedTicketValue}
                onChange={(e) => selectTicket(filteredTickets.find((ticket) => ticket._id === e.target.value) || null)}
              >
                {filteredTickets.map((ticket) => (
                  <option key={ticket._id} value={ticket._id}>
                    {ticket.ticketId} - {ticket.requesterProfile?.name || ticket.createdBy?.name || t("common.requester")}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="workflowStatus">{t("labels.status")}</label>
              <select
                id="workflowStatus"
                name="status"
                value={statusForm.status}
                onChange={handleStatusFormChange}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {enumLabel("status", status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="expectedFulfillmentDate">{t("labels.expectedFulfillmentDate")}</label>
              <input
                id="expectedFulfillmentDate"
                type="date"
                name="expectedFulfillmentDate"
                value={statusForm.expectedFulfillmentDate}
                onChange={handleStatusFormChange}
              />
            </div>

            <div className="field">
              <label htmlFor="itemAvailability">{t("labels.itemAvailability")}</label>
              <select
                id="itemAvailability"
                name="itemAvailability"
                value={statusForm.itemAvailability}
                onChange={handleStatusFormChange}
              >
                <option value="">{t("common.notUpdated")}</option>
                <option value="stock_check_pending">{enumLabel("itemAvailability", "stock_check_pending")}</option>
                <option value="available_in_stock">{enumLabel("itemAvailability", "available_in_stock")}</option>
                <option value="reserved">{enumLabel("itemAvailability", "reserved")}</option>
                <option value="procurement_required">{enumLabel("itemAvailability", "procurement_required")}</option>
                <option value="received">{enumLabel("itemAvailability", "received")}</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="procurementStatus">{t("labels.procurementStatus")}</label>
              <select
                id="procurementStatus"
                name="procurementStatus"
                value={statusForm.procurementStatus}
                onChange={handleStatusFormChange}
              >
                <option value="">{t("common.notUpdated")}</option>
                <option value="not_required">{enumLabel("procurementStatus", "not_required")}</option>
                <option value="requested">{enumLabel("procurementStatus", "requested")}</option>
                <option value="approved">{enumLabel("procurementStatus", "approved")}</option>
                <option value="ordered">{enumLabel("procurementStatus", "ordered")}</option>
                <option value="received">{enumLabel("procurementStatus", "received")}</option>
                <option value="delayed">{enumLabel("procurementStatus", "delayed")}</option>
                <option value="cancelled">{enumLabel("procurementStatus", "cancelled")}</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="installationSchedule">{t("labels.installationSchedule")}</label>
              <input
                id="installationSchedule"
                type="datetime-local"
                name="installationSchedule"
                value={statusForm.installationSchedule}
                onChange={handleStatusFormChange}
              />
            </div>

            <div className="field lg:col-span-3">
              <label htmlFor="nextAction">{t("labels.nextAction")}</label>
              <input
                id="nextAction"
                name="nextAction"
                value={statusForm.nextAction}
                onChange={handleStatusFormChange}
                placeholder={t("placeholders.nextAction")}
              />
            </div>

            <div className="field lg:col-span-3">
              <label htmlFor="remarks">{t("labels.remarks")}</label>
              <textarea
                id="remarks"
                name="remarks"
                value={statusForm.remarks}
                onChange={handleStatusFormChange}
                placeholder={t("placeholders.statusRemarks")}
                rows="3"
              />
            </div>

            <div className="lg:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SelectedSummary ticket={selectedTicket} enumLabel={enumLabel} t={t} />
              <Button type="submit" disabled={loading || !selectedTicketValue}>
                {loading ? t("common.updating") : t("common.saveStatusUpdate")}
              </Button>
            </div>
          </form>
        </section>
      )}

      <DataTable
        metric={t("common.recordsInStage", { count: filteredTickets.length, stage: workflowStages.find((stage) => stage.key === activeStage)?.label || "" })}
        emptyLabel={t("tickets.requestsForReview")}
        columns={[t("labels.request"), t("labels.requester"), t("labels.type"), t("labels.priority"), t("labels.status"), t("labels.fulfillment"), t("labels.evidence"), t("common.action")]}
      >
        {filteredTickets.length === 0 ? (
          <EmptyRow colSpan="8" message={t("tickets.empty")} />
        ) : (
          filteredTickets.map((ticket) => (
            <tr
              key={ticket._id}
              onClick={() => selectTicket(ticket)}
              className={`cursor-pointer hover:bg-slate-50 ${selectedTicketValue === ticket._id ? "selected-request-row" : ""}`}
            >
              <td className="min-w-44">
                <div className="font-black text-blue-600 hover:underline">{ticket.ticketId}</div>
                <div className="text-xs font-semibold text-slate-500">
                  {formatDate(ticket.createdAt)}
                </div>
              </td>
              <td className="min-w-52">
                <div className="font-bold text-slate-800">
                  {ticket.requesterProfile?.name || ticket.createdBy?.name || t("common.requester")}
                </div>
                <div className="text-xs text-slate-500">
                  {ticket.requesterProfile?.employeeId || t("common.noEmployeeId")} | {ticket.department}
                </div>
              </td>
              <td className="min-w-56">
                <div className="font-semibold text-slate-800">{enumLabel("requestType", ticket.requestType)}</div>
                <div className="text-xs text-slate-500">
                  {enumLabel("hardwareCategory", ticket.hardwareCategory)} {ticket.currentAssetTag ? `| ${ticket.currentAssetTag}` : ""}
                </div>
              </td>
              <td>
                <Badge tone={priorityTone(ticket.priority)}>{enumLabel("priority", ticket.priority)}</Badge>
              </td>
              <td>
                <Badge tone={statusTone(ticket.status)}>{enumLabel("status", ticket.status)}</Badge>
              </td>
              <td className="min-w-64">
                <div className="font-semibold text-slate-800">
                  {ticket.expectedFulfillmentDate
                    ? t("common.expectedOn", { date: formatDate(ticket.expectedFulfillmentDate) })
                    : t("tickets.datePending")}
                </div>
                <div className="max-w-xs truncate text-xs text-slate-500">
                  {ticket.nextAction || ticket.issueDescription}
                </div>
              </td>
              <td>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {t("common.fileCount", { count: ticket.attachments?.length || 0 })}
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
                  {t("common.options")}
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
          enumLabel={enumLabel}
          formatDate={formatDate}
          t={t}
        />
      )}
    </Layout>
  );
}

function WorkflowStageTabs({ stages, activeStage, counts, onChange, ariaLabel }) {
  return (
    <div className="workflow-strip" aria-label={ariaLabel}>
      {stages.map((stage) => (
        <button
          type="button"
          key={stage.key}
          className={`workflow-step ${activeStage === stage.key ? "is-active" : ""}`}
          style={{ "--step": stage.color }}
          onClick={() => onChange(stage.key)}
          aria-pressed={activeStage === stage.key}
        >
          <span>{stage.label}</span>
          <strong>{counts[stage.key] || 0}</strong>
        </button>
      ))}
    </div>
  );
}

function SelectedRequestCard({ ticket, enumLabel, t }) {
  if (!ticket) {
    return (
      <div className="selected-empty">
        {t("tickets.selectedEmpty")}
      </div>
    );
  }

  return (
    <div className="selected-request-card">
      <div>
        <span>{t("labels.requester")}</span>
        <strong>{ticket.requesterProfile?.name || ticket.createdBy?.name || t("common.requester")}</strong>
        <p>{ticket.requesterProfile?.employeeId || t("common.noEmployeeId")} | {ticket.department}</p>
      </div>
      <div>
        <span>{t("labels.requestType")}</span>
        <strong>{enumLabel("requestType", ticket.requestType)}</strong>
        <p>{enumLabel("hardwareCategory", ticket.hardwareCategory)} {ticket.currentAssetTag ? `| ${ticket.currentAssetTag}` : ""}</p>
      </div>
      <div>
        <span>{t("labels.priority")}</span>
        <Badge tone={priorityTone(ticket.priority)}>{enumLabel("priority", ticket.priority)}</Badge>
      </div>
      <div className="md:col-span-2">
        <span>{t("labels.issueDescription")}</span>
        <p className="selected-issue">{ticket.issueDescription}</p>
      </div>
      <div>
        <span>{t("labels.evidence")}</span>
        <strong>{t("common.fileCount", { count: ticket.attachments?.length || 0 })}</strong>
      </div>
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
  enumLabel,
  formatDate,
  t,
}) {
  const canManageRequest = canManageOwnRequest(ticket, user);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-start">
          <div>
            <p className="page-eyebrow mb-1">{t("tickets.requestOptions")}</p>
            <h3 className="text-xl font-black text-slate-950">{ticket.ticketId}</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{ticket.issueDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-lg border border-slate-200 text-lg font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label={t("tickets.closeRequestOptions")}
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">{t("tickets.requestActions")}</p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={onViewDetails}
                className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
              >
                {t("common.viewFullDetails")}
              </button>

              {canManageRequest ? (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    disabled={actionLoading}
                    className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-black text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("common.updateRequest")}
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={actionLoading}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ? t("common.deleting") : t("common.deleteRequest")}
                  </button>
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
                  {t("tickets.manageNotice")}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-sm font-black text-slate-950">{t("tickets.uploadedEvidence")}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {t("tickets.evidenceAttached", { count: ticket.attachments?.length || 0 })}
                </p>
              </div>
              <Badge tone={statusTone(ticket.status)}>{enumLabel("status", ticket.status)}</Badge>
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
                        {t("common.view")}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadEvidence(ticket._id, attachment._id, attachment.originalName)}
                        disabled={actionLoading}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("common.download")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                {t("tickets.noEvidenceDialog")}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SelectedSummary({ ticket, enumLabel, t }) {
  if (!ticket) {
    return <p className="text-sm font-semibold text-slate-500">{t("tickets.selectToUpdate")}</p>;
  }

  return (
    <div className="text-sm text-slate-600">
      <span className="font-black text-slate-900">{enumLabel("status", ticket.status)}</span>
      <span> | </span>
      <span>{ticket.nextAction || t("tickets.noNextAction")}</span>
    </div>
  );
}

function getFilteredTickets(tickets, filters, activeStage, workflowStages) {
  const keyword = filters.keyword.trim().toLowerCase();
  const stage = workflowStages.find((item) => item.key === activeStage) || workflowStages[0];

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
    const matchesStatus = filters.status
      ? ticket.status === filters.status
      : stage.statuses.includes(ticket.status);

    return matchesKeyword && matchesStatus;
  });
}

function createStatusFormFromTicket(ticket) {
  return {
    status: ticket.status || "acknowledged",
    expectedFulfillmentDate: toDateInputValue(ticket.expectedFulfillmentDate),
    itemAvailability: ticket.itemAvailability || "",
    procurementStatus: ticket.procurementStatus || "",
    installationSchedule: toDateTimeInputValue(ticket.installationSchedule),
    nextAction: ticket.nextAction || "",
    remarks: ticket.remarks || "",
    comment: "",
  };
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toDateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
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
