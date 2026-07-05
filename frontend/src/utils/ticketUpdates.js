export function formatLabel(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "N/A";

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusTone(status) {
  if (["rejected", "cancelled"].includes(status)) return "red";
  if (["procurement_required", "in_procurement", "installation_scheduled"].includes(status)) return "amber";
  if (["installed", "closed", "item_available"].includes(status)) return "green";
  if (["acknowledged", "technician_assigned", "under_review"].includes(status)) return "violet";
  if (["submitted", "need_more_information", "inventory_check"].includes(status)) return "blue";
  return "slate";
}

export function priorityTone(priority) {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "blue";
  return "green";
}

export function getPersonName(person) {
  if (!person) return "System";
  return person.name || person.email || "System";
}

function toTime(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getTicketUpdates(tickets = [], { includeInitial = false } = {}) {
  return tickets
    .flatMap((ticket) =>
      (ticket.statusHistory || []).map((history, index) => {
        const isInitial = !history.oldStatus;

        return {
          id: history._id || `${ticket._id}-${history.changedAt || index}`,
          ticketId: ticket.ticketId,
          ticketObjectId: ticket._id,
          ticketTitle: ticket.issueDescription,
          requestType: ticket.requestType,
          hardwareCategory: ticket.hardwareCategory,
          oldStatus: history.oldStatus,
          newStatus: history.newStatus,
          comment: history.comment,
          changeSummary: history.changeSummary || [],
          changedBy: history.changedBy,
          changedAt: history.changedAt,
          isInitial,
          requesterLastViewedAt: ticket.requesterLastViewedAt,
          ticketCreatedAt: ticket.createdAt,
        };
      })
    )
    .filter((update) => includeInitial || !update.isInitial)
    .sort((a, b) => toTime(b.changedAt) - toTime(a.changedAt));
}

export function getUnreadTicketUpdates(tickets = []) {
  return getTicketUpdates(tickets).filter((update) => {
    const viewedAt = toTime(update.requesterLastViewedAt || update.ticketCreatedAt);
    return toTime(update.changedAt) > viewedAt;
  });
}
