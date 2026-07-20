import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader, StatCard } from "../components/ui";
import {
  formatDate,
  formatDateTime,
  formatLabel,
  getPersonName,
  getTicketUpdates,
  getUnreadTicketUpdates,
  priorityTone,
  statusTone,
} from "../utils/ticketUpdates";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/LanguageContext";

function MyAccount() {
  const { user = {} } = useAuth();
  const { t } = useTranslation();

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    const fetchMyTickets = async () => {
      try {
        const response = await API.get("/tickets/mine");

        const nextTickets = response.data.tickets || [];
        setTickets(nextTickets);
        setSelectedTicketId((currentId) => currentId || nextTickets[0]?._id || "");
      } catch (err) {
        setError(err.response?.data?.message || t("myAccountPage.failedToLoad"));
      } finally {
        setLoading(false);
      }
    };

    fetchMyTickets();
  }, [t]);

  const unreadUpdates = useMemo(() => getUnreadTicketUpdates(tickets), [tickets]);
  const allUpdates = useMemo(() => getTicketUpdates(tickets, { includeInitial: true }), [tickets]);

  const filteredTickets = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    if (!search) return tickets;

    return tickets.filter((ticket) =>
      [
        ticket.ticketId,
        ticket.issueDescription,
        ticket.requestType,
        ticket.hardwareCategory,
        ticket.status,
        ticket.nextAction,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [keyword, tickets]);

  const selectedTicket = tickets.find((ticket) => ticket._id === selectedTicketId);
  const selectedUpdates = allUpdates.filter((update) => update.ticketObjectId === selectedTicketId);

  const openRequestCount = tickets.filter(
    (ticket) => !["closed", "rejected", "cancelled"].includes(ticket.status)
  ).length;

  const handleMarkRead = async () => {
    setError("");
    setSuccess("");
    setMarkingRead(true);

    try {
      const response = await API.put("/tickets/mine/notifications/read", {});

      setTickets(response.data.tickets || []);
      window.dispatchEvent(new Event("ticket-notifications-updated"));
      setSuccess(t("myAccountPage.markReadSuccess"));
    } catch (err) {
      setError(err.response?.data?.message || t("myAccountPage.markReadFailed"));
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t('account.eyebrow')}
        title={t('myAccountPage.myRequests')}
        description={t('account.description')}
      />

      <Alert message={error} />
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {loading ? (
        <section className="dashboard-panel p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />
          <p className="font-semibold text-slate-600">{t('myAccountPage.loadingAccount')}</p>
        </section>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label={t('myAccountPage.myRequests')} value={tickets.length} tone="blue" meta={t('myAccountPage.submittedByYou')} />
            <StatCard label={t('myAccountPage.newUpdates')} value={unreadUpdates.length} tone="amber" meta={t('myAccountPage.unreadNotifications')} />
            <StatCard label={t('myAccountPage.openRequests')} value={openRequestCount} tone="green" meta={t('myAccountPage.stillInWorkflow')} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="dashboard-panel p-5">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <p className="page-eyebrow mb-1">{t('myAccountPage.profile')}</p>
                <h3 className="text-lg font-black text-slate-950">{user.name || t('myAccountPage.currentUser')}</h3>
              </div>

              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <ProfileItem label={t('myAccountPage.employeeId')} value={user.employeeId || t('common.notAssigned')} />
                <ProfileItem label={t('myAccountPage.role')} value={formatLabel(user.role || "team")} />
                <ProfileItem label={t('myAccountPage.department')} value={user.department || t('common.unassigned')} />
                <ProfileItem label={t('myAccountPage.designation')} value={user.designation || t('common.notAssigned')} />
                <ProfileItem label={t('myAccountPage.email')} value={user.email || t('common.emailNotAvailable')} />
                <ProfileItem label={t('myAccountPage.phone')} value={user.phone || t('common.emailNotAvailable')} />
                <ProfileItem label={t('myAccountPage.office')} value={user.officeLocation || t('common.notAssigned')} />
              </dl>
            </section>

            <section className="dashboard-panel p-5">
              <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                <div>
                  <p className="page-eyebrow mb-1">{t('myAccountPage.notifications')}</p>
                  <h3 className="text-lg font-black text-slate-950">{t('myAccountPage.latestRequestUpdates')}</h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleMarkRead}
                  disabled={markingRead || unreadUpdates.length === 0}
                >
                  {markingRead ? t('common.marking') : t('common.markAllRead')}
                </Button>
              </div>

              {unreadUpdates.length === 0 ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                  {t('myAccountPage.noNewRequestUpdates')}
                </div>
              ) : (
                <div className="space-y-3">
                  {unreadUpdates.slice(0, 5).map((update) => (
                    <button
                      key={update.id}
                      type="button"
                      onClick={() => setSelectedTicketId(update.ticketObjectId)}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-100"
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="font-black text-slate-950">{update.ticketId}</p>
                          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">
                            {update.comment || update.changeSummary.join(", ") || formatLabel(update.newStatus)}
                          </p>
                        </div>
                        <Badge tone={statusTone(update.newStatus)}>{formatLabel(update.newStatus)}</Badge>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {formatDateTime(update.changedAt)} {t('common.by')} {getPersonName(update.changedBy)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="filter-panel">
            <div className="field">
              <label htmlFor="accountRequestSearch">{t('myAccountPage.searchMyRequests')}</label>
              <input
                id="accountRequestSearch"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={t('myAccountPage.searchPlaceholder')}
              />
            </div>
          </section>

          <DataTable
            metric={`${filteredTickets.length} records`}
            emptyLabel={t('myAccountPage.submittedRequests')}
            columns={[t('labels.request'), t('labels.hardwareCategory'), t('labels.priority'), t('labels.status'), t('myAccountPage.latestRequestUpdates'), t('common.actions')]}
          >
            {filteredTickets.length === 0 ? (
              <EmptyRow colSpan="6" message={t('myAccountPage.noSubmittedRequests')} />
            ) : (
              filteredTickets.map((ticket) => {
                const latestUpdate = getTicketUpdates([ticket], { includeInitial: true })[0];

                return (
                  <tr key={ticket._id} className={selectedTicketId === ticket._id ? "bg-cyan-50/70" : ""}>
                    <td className="min-w-56">
                      <div className="font-black text-slate-950">{ticket.ticketId}</div>
                      <div className="text-xs font-semibold text-slate-500">
                        {t('common.submittedOn', { date: formatDate(ticket.createdAt) })}
                      </div>
                    </td>
                    <td className="min-w-72">
                      <div className="font-semibold text-slate-800">{formatLabel(ticket.requestType)}</div>
                      <div className="max-w-md truncate text-xs text-slate-500">
                        {formatLabel(ticket.hardwareCategory)} | {ticket.issueDescription}
                      </div>
                    </td>
                    <td>
                      <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone(ticket.status)}>{formatLabel(ticket.status)}</Badge>
                    </td>
                    <td className="min-w-72">
                      <div className="font-semibold text-slate-800">
                        {latestUpdate ? formatDateTime(latestUpdate.changedAt) : t('myAccountPage.noUpdateYet')}
                      </div>
                      <div className="max-w-xs truncate text-xs text-slate-500">
                        {latestUpdate?.comment || ticket.nextAction || t('myAccountPage.awaitingUpdate')}
                      </div>
                    </td>
                    <td>
                      <Button type="button" variant="secondary" onClick={() => setSelectedTicketId(ticket._id)}>
                        {t('myAccountPage.view')}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </DataTable>

          <section className="mt-6 dashboard-panel p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
              <div>
                <p className="page-eyebrow mb-1">{t('labels.updateHistory')}</p>
                <h3 className="text-lg font-black text-slate-950">
                  {selectedTicket ? selectedTicket.ticketId : t('myAccountPage.selectARequest')}
                </h3>
              </div>
              {selectedTicket && <Badge tone={statusTone(selectedTicket.status)}>{formatLabel(selectedTicket.status)}</Badge>}
            </div>

            {!selectedTicket ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                {t('myAccountPage.selectToViewHistory')}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-900">{t('myAccountPage.currentWorkflow')}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <SummaryRow label={t('myAccountPage.nextAction')} value={selectedTicket.nextAction || t('myAccountPage.notRecorded')} />
                    <SummaryRow
                      label={t('myAccountPage.expectedFulfillment')}
                      value={selectedTicket.expectedFulfillmentDate ? formatDate(selectedTicket.expectedFulfillmentDate) : t('common.pending')}
                    />
                    <SummaryRow
                      label={t('myAccountPage.installationSchedule')}
                      value={selectedTicket.installationSchedule ? formatDateTime(selectedTicket.installationSchedule) : t('common.pending')}
                    />
                    <SummaryRow
                      label={t('myAccountPage.itemAvailability')}
                      value={selectedTicket.itemAvailability ? formatLabel(selectedTicket.itemAvailability) : t('common.notUpdated')}
                    />
                    <SummaryRow
                      label={t('myAccountPage.procurement')}
                      value={selectedTicket.procurementStatus ? formatLabel(selectedTicket.procurementStatus) : t('common.notUpdated')}
                    />
                    <SummaryRow label={t('myAccountPage.remarks')} value={selectedTicket.remarks || t('myAccountPage.noRemarks')} />
                  </div>
                </div>

                <ol className="space-y-4">
                  {selectedUpdates.map((update) => (
                    <li key={update.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {update.comment || update.changeSummary.join(", ") || t('myAccountPage.requestUpdated')}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDateTime(update.changedAt)} {t('common.by')} {getPersonName(update.changedBy)}
                            {update.changedBy?.role ? ` (${formatLabel(update.changedBy.role)})` : ""}
                          </p>
                        </div>
                        <Badge tone={statusTone(update.newStatus)}>{formatLabel(update.newStatus)}</Badge>
                      </div>

                      {update.changeSummary.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {update.changeSummary.map((item, index) => (
                            <span
                              key={`${item}-${index}`}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold text-slate-800 sm:text-right">{value}</span>
    </div>
  );
}

export default MyAccount;
