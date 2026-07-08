import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, PageHeader } from "../components/ui";
import { hasRole, IT_INVENTORY_ROLES } from "../utils/roles";

const dashboardIcons = {
  queue: <path d="M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm12 0h4v8H4v-2h12v-6Z" />,
  assets: <path d="M4 5h16v10H4V5Zm6 12h4v2h4v2H6v-2h4v-2Z" />,
  stock: <path d="M4 7 12 3l8 4-8 4-8-4Zm0 3 8 4 8-4v7l-8 4-8-4v-7Z" />,
  repair: <path d="m14.7 6.3 3-3 3 3-3 3-3-3ZM3 17.6l7.8-7.8 3.4 3.4L6.4 21H3v-3.4Z" />,
};

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const canViewInventory = hasRole(user, IT_INVENTORY_ROLES);
  const model = useMemo(() => (summary ? buildDashboardModel(summary) : null), [summary]);

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
        setError(err.response?.data?.message || "Failed to load dashboard");
      }
    };

    fetchSummary();
  }, []);

  return (
    <Layout>
      <Alert message={error} />

      {!summary && !error && (
        <div className="dashboard-panel p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />
          <p className="font-semibold text-slate-600">Loading dashboard...</p>
        </div>
      )}

      {model && (
        <>
          <PageHeader
            eyebrow="Executive operations"
            title="Helpdesk Intelligence Dashboard"
            description="A focused management view of service demand, asset reliability, procurement exposure and inventory risk."
          />

          <ExecutiveSnapshot items={model.executiveSnapshot} />

          <section className="dashboard-kpi-grid" aria-label="Dashboard highlights">
            <MetricCard
              icon="queue"
              label="Open Service Load"
              value={model.activeQueue}
              meta={`${model.completionRate}% closure rate`}
              tone="blue"
            />
            <MetricCard
              icon="assets"
              label="Asset Reliability"
              value={`${model.assetHealth}%`}
              meta={`${model.assets.active} active of ${model.assets.total}`}
              tone="green"
            />
            <MetricCard
              icon="stock"
              label="Inventory Risk"
              value={model.inventory.lowStockCount}
              meta={`${model.inventory.readyCount} items within threshold`}
              tone="red"
            />
            <MetricCard
              icon="repair"
              label="Repair Register"
              value={model.repairs.total}
              meta="Repair records"
              tone="amber"
            />
          </section>

          <section className="dashboard-main-grid">
            <DashboardPanel className="dashboard-panel-wide">
              <PanelHeader
                eyebrow="Requests"
                title="Lifecycle Distribution"
                meta={`${model.tickets.total} total requests`}
              />
              <LifecycleBarChart data={model.ticketStages} />
            </DashboardPanel>

            <DashboardPanel>
              <PanelHeader
                eyebrow="Assets"
                title="Condition Mix"
                meta={`${model.assets.total} tracked assets`}
              />
              <DonutSummary
                value={`${model.assetHealth}%`}
                label="active"
                segments={model.assetSegments}
              />
            </DashboardPanel>
          </section>

          <section className="dashboard-main-grid dashboard-lower-grid">
            <DashboardPanel>
              <PanelHeader
                eyebrow="Priorities"
                title="Operational Watchlist"
                meta={`${model.attentionCount} items need attention`}
              />
              <ActionFocus
                actions={model.actionItems}
                canViewInventory={canViewInventory}
                onNavigate={navigate}
              />
            </DashboardPanel>

            <DashboardPanel>
              <PanelHeader
                eyebrow="Inventory"
                title="Reorder Watch"
                meta={`${model.inventory.lowStockCount} item alerts`}
              />
              <LowStockList items={model.inventory.lowStockItems} canViewInventory={canViewInventory} />
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

function LowStockList({ items, canViewInventory }) {
  if (items.length === 0) {
    return (
      <div className="dashboard-empty-state">
        <strong>Stock levels are healthy</strong>
        <span>No inventory items are below reorder level.</span>
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
        const shortageLabel = shortage > 0 ? `Need ${shortage}` : "At threshold";

        return (
          <div className="stock-watch-row" key={item._id || `${item.itemName}-${index}`}>
            <div className="stock-watch-copy">
              <strong>{item.itemName}</strong>
              <span>{formatLabel(item.category)}{item.location ? ` - ${item.location}` : ""}</span>
            </div>
            <div className="stock-watch-meter">
              <div className="stock-meter-track" style={{ "--stock-width": `${stockPercent}%` }}>
                <span />
              </div>
              <small>{quantity}/{reorderLevel} in stock</small>
            </div>
            <span className="stock-shortage">{shortageLabel}</span>
          </div>
        );
      })}

      {!canViewInventory && (
        <div className="stock-watch-note">
          Inventory page access is limited to IT inventory roles.
        </div>
      )}
    </div>
  );
}

function buildDashboardModel(summary) {
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
  const riskLabel = attentionCount > 0 ? "Monitor" : "Stable";

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
        label: "Registered Users",
        value: count(summary.users?.total),
        meta: "Active system audience",
      },
      {
        label: "Total Requests",
        value: ticketCounts.total,
        meta: `${completedRequests} completed requests`,
      },
      {
        label: "Inventory Items",
        value: totalInventoryItems,
        meta: `${Math.max(totalInventoryItems - lowStockCount, 0)} within reorder level`,
      },
      {
        label: "Risk Posture",
        value: riskLabel,
        meta: `${attentionCount} operational signal${attentionCount === 1 ? "" : "s"}`,
      },
    ],
    ticketStages: [
      { label: "Submitted", value: ticketCounts.submitted, color: "#4b66ad" },
      { label: "Acknowledged", value: ticketCounts.acknowledged, color: "#7c5fd6" },
      { label: "Under Review", value: ticketCounts.underReview, color: "#efb94e" },
      { label: "Procurement", value: ticketCounts.procurement, color: "#df6e75" },
      { label: "Available", value: ticketCounts.itemAvailable, color: "#22a2b8" },
      { label: "Scheduled", value: ticketCounts.installationScheduled, color: "#2f9e72" },
      { label: "Installed", value: ticketCounts.installed, color: "#44b88a" },
      { label: "Closed", value: ticketCounts.closed, color: "#64748b" },
    ],
    assetSegments: [
      { label: "Active", value: assetCounts.active, color: "#44b88a" },
      { label: "Under Repair", value: assetCounts.underRepair, color: "#efb94e" },
      { label: "Damaged", value: assetCounts.damaged, color: "#df6e75" },
      { label: "Retired", value: assetCounts.retired, color: "#64748b" },
    ],
    actionItems: [
      {
        label: "Approval backlog",
        value: ticketCounts.submitted + ticketCounts.acknowledged + ticketCounts.underReview,
        meta: "Intake, acknowledgement and review-stage requests",
        tone: "blue",
        path: "/tickets",
      },
      {
        label: "Procurement exposure",
        value: ticketCounts.procurement,
        meta: "Hardware requests waiting for supply action",
        tone: "amber",
        path: "/tickets",
      },
      {
        label: "Installation readiness",
        value: ticketCounts.itemAvailable + ticketCounts.installationScheduled,
        meta: "Items available or already scheduled",
        tone: "green",
        path: "/tickets",
      },
      {
        label: "Reorder risk",
        value: lowStockCount,
        meta: "Inventory items below reorder threshold",
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

function formatLabel(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default Dashboard;
