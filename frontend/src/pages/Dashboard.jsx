import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, PageHeader } from "../components/ui";
import { hasRole, IT_INVENTORY_ROLES } from "../utils/roles";
import { useTranslation } from "../i18n/LanguageContext";

const dashboardIcons = {
  queue: <path d="M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm12 0h4v8H4v-2h12v-6Z" />,
  assets: <path d="M4 5h16v10H4V5Zm6 12h4v2h4v2H6v-2h4v-2Z" />,
  stock: <path d="M4 7 12 3l8 4-8 4-8-4Zm0 3 8 4 8-4v7l-8 4-8-4v-7Z" />,
  repair: <path d="m14.7 6.3 3-3 3 3-3 3-3-3ZM3 17.6l7.8-7.8 3.4 3.4L6.4 21H3v-3.4Z" />,
};

function Dashboard() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const canViewInventory = hasRole(user, IT_INVENTORY_ROLES);
  const model = useMemo(() => (summary ? buildDashboardModel(summary, t, enumLabel) : null), [enumLabel, summary, t]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/dashboard/summary", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSummary(response.data);
      } catch (err) {
        setError(err.response?.data?.message || t("dashboard.loadError"));
      }
    };

    fetchSummary();
  }, [t]);

  return (
    <Layout>
      <Alert message={error} />

      {!summary && !error && (
        <div className="dashboard-panel p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />
          <p className="font-semibold text-slate-600">{t("dashboard.loading")}</p>
        </div>
      )}

      {model && (
        <>
          <PageHeader
            eyebrow={t("dashboard.eyebrow")}
            title={t("dashboard.title")}
            description={t("dashboard.description")}
          />

          <ExecutiveSnapshot items={model.executiveSnapshot} />

          <section className="dashboard-kpi-grid" aria-label={t("dashboard.highlights")}>
            <MetricCard
              icon="queue"
              label={t("dashboard.openServiceLoad")}
              value={model.activeQueue}
              meta={t("dashboard.closureRate", { rate: model.completionRate })}
              tone="blue"
            />
            <MetricCard
              icon="assets"
              label={t("dashboard.assetReliability")}
              value={`${model.assetHealth}%`}
              meta={t("dashboard.activeOfTotal", { active: model.assets.active, total: model.assets.total })}
              tone="green"
            />
            <MetricCard
              icon="stock"
              label={t("dashboard.inventoryRisk")}
              value={model.inventory.lowStockCount}
              meta={t("dashboard.withinThreshold", { count: model.inventory.readyCount })}
              tone="red"
            />
            <MetricCard
              icon="repair"
              label={t("dashboard.repairRegister")}
              value={model.repairs.total}
              meta={t("dashboard.repairRecords")}
              tone="amber"
            />
          </section>

          <section className="dashboard-main-grid">
            <DashboardPanel className="dashboard-panel-wide">
              <PanelHeader
                eyebrow={t("dashboard.requests")}
                title={t("dashboard.lifecycleDistribution")}
                meta={t("dashboard.totalRequests", { count: model.tickets.total })}
              />
              <LifecycleBarChart data={model.ticketStages} />
            </DashboardPanel>

            <DashboardPanel>
              <PanelHeader
                eyebrow={t("dashboard.assets")}
                title={t("dashboard.conditionMix")}
                meta={t("dashboard.trackedAssets", { count: model.assets.total })}
              />
              <DonutSummary
                value={`${model.assetHealth}%`}
                label={t("dashboard.active")}
                segments={model.assetSegments}
              />
            </DashboardPanel>
          </section>

          <section className="dashboard-main-grid dashboard-lower-grid">
            <DashboardPanel>
              <PanelHeader
                eyebrow={t("dashboard.priorities")}
                title={t("dashboard.operationalWatchlist")}
                meta={t("dashboard.needAttention", { count: model.attentionCount })}
              />
              <ActionFocus
                actions={model.actionItems}
                canViewInventory={canViewInventory}
                onNavigate={navigate}
              />
            </DashboardPanel>

            <DashboardPanel>
              <PanelHeader
                eyebrow={t("dashboard.inventory")}
                title={t("dashboard.reorderWatch")}
                meta={t("dashboard.itemAlerts", { count: model.inventory.lowStockCount })}
              />
              <LowStockList items={model.inventory.lowStockItems} canViewInventory={canViewInventory} enumLabel={enumLabel} t={t} />
            </DashboardPanel>
          </section>
        </>
      )}
    </Layout>
  );
}

function ExecutiveSnapshot({ items }) {
  return (
    <section className="dashboard-executive-strip" aria-label="Executive snapshot">
      {items.map((item) => (
        <div className="executive-tile" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.meta}</small>
        </div>
      ))}
    </section>
  );
}

function DashboardIcon({ name, className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {dashboardIcons[name]}
    </svg>
  );
}

function DashboardPanel({ children, className = "" }) {
  return <section className={`dashboard-modern-panel ${className}`.trim()}>{children}</section>;
}

function PanelHeader({ eyebrow, title, meta }) {
  return (
    <div className="dashboard-panel-header">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      {meta && <span>{meta}</span>}
    </div>
  );
}

function MetricCard({ icon, label, value, meta, tone }) {
  return (
    <article className={`dashboard-metric metric-${tone}`}>
      <div className="dashboard-metric-icon">
        <DashboardIcon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{meta}</span>
      </div>
    </article>
  );
}

function LifecycleBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="lifecycle-chart">
      {data.map((item) => {
        const width = item.value > 0 ? Math.max((item.value / maxValue) * 100, 5) : 0;

        return (
          <div className="lifecycle-row" key={item.label}>
            <div className="lifecycle-label">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div
              className="lifecycle-track"
              role="img"
              aria-label={`${item.label}: ${item.value}`}
              style={{ "--bar-width": `${width}%`, "--bar-color": item.color }}
            >
              <span />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutSummary({ value, label, segments }) {
  const gradient = buildDonutGradient(segments);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="donut-summary">
      <div className="donut-chart" style={{ background: gradient }} aria-label={`${value} ${label}`}>
        <div className="donut-center">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      </div>

      <div className="donut-legend">
        {segments.map((segment) => (
          <div className="donut-legend-row" key={segment.label}>
            <span className="legend-swatch" style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
            <small>{percent(segment.value, total)}%</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionFocus({ actions, canViewInventory, onNavigate }) {
  return (
    <div className="focus-list">
      {actions.map((action) => {
        const isLocked = action.path === "/inventory" && !canViewInventory;

        return (
          <button
            type="button"
            className={`focus-row focus-${action.tone}`}
            key={action.label}
            disabled={isLocked}
            onClick={() => onNavigate(action.path)}
          >
            <span className="focus-value">{action.value}</span>
            <span className="focus-copy">
              <strong>{action.label}</strong>
              <small>{action.meta}</small>
            </span>
            <span className="focus-arrow" aria-hidden="true">-&gt;</span>
          </button>
        );
      })}
    </div>
  );
}

function LowStockList({ items, canViewInventory, enumLabel, t }) {
  if (items.length === 0) {
    return (
      <div className="dashboard-empty-state">
        <strong>{t("dashboard.stockHealthy")}</strong>
        <span>{t("dashboard.noReorderItems")}</span>
      </div>
    );
  }

  return (
    <div className="stock-watch-list">
      {items.slice(0, 5).map((item, index) => {
        const quantity = count(item.quantity);
        const reorderLevel = count(item.reorderLevel);
        const stockPercent = clampPercent(percent(quantity, Math.max(reorderLevel, 1)));
        const shortage = Math.max(reorderLevel - quantity, 0);
        const shortageLabel = shortage > 0 ? t("dashboard.needQuantity", { count: shortage }) : t("common.atThreshold");

        return (
          <div className="stock-watch-row" key={item._id || `${item.itemName}-${index}`}>
            <div className="stock-watch-copy">
              <strong>{item.itemName}</strong>
              <span>{enumLabel("inventoryCategory", item.category)}{item.location ? ` - ${item.location}` : ""}</span>
            </div>
            <div className="stock-watch-meter">
              <div className="stock-meter-track" style={{ "--stock-width": `${stockPercent}%` }}>
                <span />
              </div>
              <small>{t("dashboard.stockCount", { quantity, reorderLevel })}</small>
            </div>
            <span className="stock-shortage">{shortageLabel}</span>
          </div>
        );
      })}

      {!canViewInventory && (
        <div className="stock-watch-note">
          {t("dashboard.inventoryAccessLimited")}
        </div>
      )}
    </div>
  );
}

function buildDashboardModel(summary, t, enumLabel) {
  const tickets = summary.tickets || {};
  const assets = summary.assets || {};
  const inventory = summary.inventory || {};
  const repairs = summary.repairs || {};

  const ticketCounts = {
    submitted: count(tickets.submitted),
    acknowledged: count(tickets.acknowledged),
    underReview: count(tickets.underReview),
    procurement: count(tickets.procurement),
    itemAvailable: count(tickets.itemAvailable),
    installationScheduled: count(tickets.installationScheduled),
    installed: count(tickets.installed),
    closed: count(tickets.closed),
    total: count(tickets.total),
  };

  const assetCounts = {
    active: count(assets.active),
    underRepair: count(assets.underRepair),
    damaged: count(assets.damaged),
    retired: count(assets.retired),
    total: count(assets.total),
  };

  const activeQueue =
    ticketCounts.submitted +
    ticketCounts.acknowledged +
    ticketCounts.underReview +
    ticketCounts.procurement +
    ticketCounts.itemAvailable +
    ticketCounts.installationScheduled;
  const completedRequests = ticketCounts.installed + ticketCounts.closed;
  const lowStockItems = Array.isArray(inventory.lowStockItems) ? inventory.lowStockItems : [];
  const lowStockCount = count(inventory.lowStockCount);
  const totalInventoryItems = count(inventory.totalItems);
  const attentionCount = lowStockCount + ticketCounts.procurement + assetCounts.damaged;
  const riskLabel = attentionCount > 0 ? t("dashboard.riskMonitor") : t("dashboard.riskStable");

  return {
    users: {
      total: count(summary.users?.total),
    },
    tickets: ticketCounts,
    assets: assetCounts,
    repairs: {
      total: count(repairs.total),
    },
    inventory: {
      totalItems: totalInventoryItems,
      lowStockCount,
      readyCount: Math.max(totalInventoryItems - lowStockCount, 0),
      lowStockItems,
    },
    activeQueue,
    attentionCount,
    completionRate: percent(completedRequests, ticketCounts.total),
    assetHealth: percent(assetCounts.active, assetCounts.total),
    executiveSnapshot: [
      {
        label: t("dashboard.registeredUsers"),
        value: count(summary.users?.total),
        meta: t("dashboard.activeAudience"),
      },
      {
        label: t("dashboard.totalRequestsLabel"),
        value: ticketCounts.total,
        meta: t("dashboard.completedRequests", { count: completedRequests }),
      },
      {
        label: t("dashboard.inventoryItems"),
        value: totalInventoryItems,
        meta: t("dashboard.withinReorderLevel", { count: Math.max(totalInventoryItems - lowStockCount, 0) }),
      },
      {
        label: t("dashboard.riskPosture"),
        value: riskLabel,
        meta: t("dashboard.operationalSignals", { count: attentionCount }),
      },
    ],
    ticketStages: [
      { label: t("dashboard.stages.submitted"), value: ticketCounts.submitted, color: "#4b66ad" },
      { label: t("dashboard.stages.acknowledged"), value: ticketCounts.acknowledged, color: "#7c5fd6" },
      { label: t("dashboard.stages.underReview"), value: ticketCounts.underReview, color: "#efb94e" },
      { label: t("dashboard.stages.procurement"), value: ticketCounts.procurement, color: "#df6e75" },
      { label: t("dashboard.stages.available"), value: ticketCounts.itemAvailable, color: "#22a2b8" },
      { label: t("dashboard.stages.scheduled"), value: ticketCounts.installationScheduled, color: "#2f9e72" },
      { label: t("dashboard.stages.installed"), value: ticketCounts.installed, color: "#44b88a" },
      { label: t("dashboard.stages.closed"), value: ticketCounts.closed, color: "#64748b" },
    ],
    assetSegments: [
      { label: enumLabel("assetStatus", "active"), value: assetCounts.active, color: "#44b88a" },
      { label: enumLabel("assetStatus", "under_repair"), value: assetCounts.underRepair, color: "#efb94e" },
      { label: enumLabel("assetStatus", "damaged"), value: assetCounts.damaged, color: "#df6e75" },
      { label: enumLabel("assetStatus", "retired"), value: assetCounts.retired, color: "#64748b" },
    ],
    actionItems: [
      {
        label: t("dashboard.approvalBacklog"),
        value: ticketCounts.submitted + ticketCounts.acknowledged + ticketCounts.underReview,
        meta: t("dashboard.approvalBacklogMeta"),
        tone: "blue",
        path: "/tickets",
      },
      {
        label: t("dashboard.procurementExposure"),
        value: ticketCounts.procurement,
        meta: t("dashboard.procurementExposureMeta"),
        tone: "amber",
        path: "/tickets",
      },
      {
        label: t("dashboard.installationReadiness"),
        value: ticketCounts.itemAvailable + ticketCounts.installationScheduled,
        meta: t("dashboard.installationReadinessMeta"),
        tone: "green",
        path: "/tickets",
      },
      {
        label: t("dashboard.reorderRisk"),
        value: lowStockCount,
        meta: t("dashboard.reorderRiskMeta"),
        tone: "red",
        path: "/inventory",
      },
    ],
  };
}

function buildDonutGradient(segments) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (total === 0) {
    return "conic-gradient(#edf1f8 0 100%)";
  }

  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    const end = cursor + (segment.value / total) * 100;
    cursor = end;

    return `${segment.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function count(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((count(value) / count(total)) * 100);
}

function clampPercent(value) {
  return Math.max(0, Math.min(value, 100));
}

export default Dashboard;
