const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const percentage = (value, total) => (number(total) ? Math.round((number(value) / number(total)) * 100) : 0);

export function buildDashboardModel(summary, t, enumLabel) {
  const tickets = summary.tickets || {};
  const assets = summary.assets || {};
  const inventory = summary.inventory || {};
  const network = summary.network || null;

  const ticketCounts = {
    submitted: number(tickets.submitted),
    acknowledged: number(tickets.acknowledged),
    underReview: number(tickets.underReview),
    procurement: number(tickets.procurement),
    itemAvailable: number(tickets.itemAvailable),
    installationScheduled: number(tickets.installationScheduled),
    installed: number(tickets.installed),
    closed: number(tickets.closed),
    approved: number(tickets.approved),
    rejected: number(tickets.rejected),
    total: number(tickets.total),
  };
  const activeQueue = ticketCounts.submitted + ticketCounts.acknowledged + ticketCounts.underReview +
    ticketCounts.procurement + ticketCounts.itemAvailable + ticketCounts.installationScheduled;
  const pendingApprovals = ticketCounts.submitted + ticketCounts.acknowledged + ticketCounts.underReview;
  const inProgress = ticketCounts.underReview + ticketCounts.procurement + ticketCounts.itemAvailable + ticketCounts.installationScheduled;
  const completed = ticketCounts.installed + ticketCounts.closed;

  const assetCounts = {
    active: number(assets.active),
    issued: number(assets.issued),
    underRepair: number(assets.underRepair),
    damaged: number(assets.damaged),
    retired: number(assets.retired),
    destroyed: number(assets.destroyed),
    total: number(assets.total),
  };
  const goodAssets = assetCounts.active + assetCounts.issued;
  const lowStockItems = Array.isArray(inventory.lowStockItems) ? inventory.lowStockItems : [];
  const lowStockCount = number(inventory.lowStockCount);

  return {
    tickets: ticketCounts,
    assets: assetCounts,
    activeQueue,
    pendingApprovals,
    activeAssetCount: goodAssets,
    activeAssetPercentage: percentage(goodAssets, assetCounts.total),
    inventory: {
      totalItems: number(inventory.totalItems),
      lowStockCount,
      lowStockItems,
    },
    network: network ? {
      available: true,
      total: number(network.total ?? network.totalDevices),
      online: number(network.online ?? network.onlineDevices),
      offline: number(network.offline ?? network.offlineDevices),
      lastCheckedAt: network.lastCheckedAt || network.lastCheckTime || null,
    } : { available: false, total: null, online: null, offline: null, lastCheckedAt: null },
    requestStages: [
      { label: t("dashboard.stages.submitted"), value: ticketCounts.submitted, status: "submitted" },
      { label: t("dashboard.stages.approved"), value: ticketCounts.approved, status: "approved", unavailable: tickets.approved == null },
      { label: t("dashboard.stages.inProgress"), value: inProgress, status: "pending" },
      { label: t("dashboard.stages.completed"), value: completed, status: "completed" },
      { label: t("dashboard.stages.rejected"), value: ticketCounts.rejected, status: "rejected", unavailable: tickets.rejected == null },
    ],
    assetConditions: [
      { label: t("dashboard.conditions.good"), value: goodAssets, status: "online" },
      { label: t("dashboard.conditions.needsRepair"), value: assetCounts.damaged, status: "rejected" },
      { label: t("dashboard.conditions.underMaintenance"), value: assetCounts.underRepair, status: "pending" },
      { label: t("dashboard.conditions.retired"), value: assetCounts.retired + assetCounts.destroyed, status: "offline" },
    ],
    pendingActions: Array.isArray(summary.pendingActions) ? summary.pendingActions : [],
    activities: Array.isArray(summary.recentActivity) ? summary.recentActivity : [],
    attention: {
      total: lowStockCount + assetCounts.damaged + pendingApprovals,
      lowStock: lowStockCount,
      damagedAssets: assetCounts.damaged,
      pendingApprovals,
    },
    enumLabel,
  };
}
