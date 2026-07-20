import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/LanguageContext";
import StatCard from "./StatCard";

export default function DashboardStats({ model, canViewInventory, canViewNetwork }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const networkValue = model.network.available ? model.network.online : "—";
  return (
    <section aria-labelledby="operational-summary-title">
      <div className="dashboard-section-title"><div><h2 id="operational-summary-title">{t('dashboardPage.operationalSummary')}</h2><p>{t('dashboardPage.currentWorkloadDesc')}</p></div></div>
      <div className="dashboard-stats-grid">
        <StatCard title={t('dashboardPage.openRequests')} value={model.activeQueue} detail={`${model.tickets.submitted} ${t('dashboardPage.pendingSubmissions')}`} actionLabel={t('dashboardPage.viewRequests')} onAction={() => navigate("/tickets")} />
        <StatCard title={t('dashboardPage.pendingApprovals')} value={model.pendingApprovals} detail={t('dashboardPage.requestsWaitingAdmin')} status={{ status: model.pendingApprovals ? "pending" : "completed" }} actionLabel={t('dashboardPage.reviewQueue')} onAction={() => navigate("/tickets")} />
        <StatCard title={t('dashboardPage.activeAssets')} value={model.activeAssetCount} detail={`${model.activeAssetPercentage}% ${t('ui.of')} ${model.assets.total} ${t('dashboard.registeredAssets')}`} actionLabel={t('dashboardPage.viewAssets')} onAction={() => navigate("/assets")} />
        <StatCard title={t('dashboardPage.networkStatus')} value={networkValue} detail={model.network.available ? `${model.network.offline} ${t('dashboard.offlineOf')} ${model.network.total}` : t('dashboardPage.telemetryNotIncluded')} status={model.network.available ? { status: model.network.offline ? "offline" : "online" } : { label: t('dashboardPage.notReported'), tone: "neutral" }} actionLabel={t('dashboardPage.viewNetwork')} disabled={!canViewNetwork} onAction={() => navigate("/network")} />
        <StatCard title={t('dashboardPage.inventoryAlerts')} value={model.inventory.lowStockCount} detail={t('dashboardPage.itemsAtOrBelowMinimum')} status={{ status: model.inventory.lowStockCount ? "low_stock" : "completed" }} actionLabel={t('dashboardPage.viewInventory')} disabled={!canViewInventory} onAction={() => navigate("/inventory")} />
      </div>
    </section>
  );
}
