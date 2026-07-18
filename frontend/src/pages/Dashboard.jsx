import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStats from "../components/dashboard/DashboardStats";
import SystemAlerts from "../components/dashboard/SystemAlerts";
import PendingActions from "../components/dashboard/PendingActions";
import RequestOverview from "../components/dashboard/RequestOverview";
import AssetSummary from "../components/dashboard/AssetSummary";
import NetworkSummary from "../components/dashboard/NetworkSummary";
import InventoryWarnings from "../components/dashboard/InventoryWarnings";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import { Button, ErrorState } from "../design-system";
import API from "../services/api";
import { useTranslation } from "../i18n/LanguageContext";
import { hasRole, IT_INVENTORY_ROLES, NETWORK_MONITORING_VIEW_ROLES } from "../utils/roles";
import { buildDashboardModel } from "../components/dashboard/dashboardModel";
import "../components/dashboard/dashboard.css";

function Dashboard() {
  const { enumLabel, formatDateTime, t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);

  const requestSummary = useCallback(() => {
    const token = localStorage.getItem("token");
    return API.get("/dashboard/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }, []);

  const refreshSummary = async () => {
    setRefreshing(true);
    try {
      const response = await requestSummary();
      setSummary(response.data);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || t("dashboard.loadError"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    requestSummary()
      .then((response) => {
        if (!active) return;
        setSummary(response.data);
        setError("");
        setLastUpdated(new Date());
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || t("dashboard.loadError"));
      });
    return () => { active = false; };
  }, [requestSummary, t]);

  const model = useMemo(
    () => (summary ? buildDashboardModel(summary, t, enumLabel) : null),
    [enumLabel, summary, t]
  );

  return (
    <Layout>
      <main className="enterprise-dashboard">
        <DashboardHeader
          lastUpdated={lastUpdated ? formatDateTime(lastUpdated) : null}
          refreshing={refreshing}
          onRefresh={refreshSummary}
        />

        {error && !summary && (
          <ErrorState
            title="Dashboard unavailable"
            message={error}
            action={<Button variant="secondary" onClick={refreshSummary}>Try again</Button>}
          />
        )}

        {!summary && !error && <DashboardSkeleton />}

        {model && (
          <div className="dashboard-content" aria-busy={refreshing || undefined}>
            {error && <ErrorState title="Dashboard refresh failed" message={error} />}
            <SystemAlerts model={model} />
            <DashboardStats
              model={model}
              canViewInventory={hasRole(user, IT_INVENTORY_ROLES)}
              canViewNetwork={hasRole(user, NETWORK_MONITORING_VIEW_ROLES)}
            />
            <PendingActions actions={model.pendingActions} pendingCount={model.pendingApprovals} />

            <div className="dashboard-section-grid">
              <RequestOverview stages={model.requestStages} total={model.tickets.total} />
              <AssetSummary conditions={model.assetConditions} total={model.assets.total} />
            </div>

            <div className="dashboard-section-grid">
              <NetworkSummary network={model.network} canView={hasRole(user, NETWORK_MONITORING_VIEW_ROLES)} />
              <InventoryWarnings
                items={model.inventory.lowStockItems}
                canView={hasRole(user, IT_INVENTORY_ROLES)}
                enumLabel={enumLabel}
              />
            </div>

            <ActivityTimeline activities={model.activities} formatDateTime={formatDateTime} />
          </div>
        )}
      </main>
    </Layout>
  );
}

export default Dashboard;
