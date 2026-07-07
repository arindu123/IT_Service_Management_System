import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, PageHeader, StatCard } from "../components/ui";

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

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

      {summary && (
        <>
          <PageHeader
            eyebrow="Operations overview"
            title="Helpdesk Dashboard"
            description="A live view of hardware requests, approvals, procurement progress, assets and stock alerts."
            action={<Button onClick={() => navigate("/tickets/create")}>New Request</Button>}
          />

          <OperationsBoard summary={summary} />

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={summary.users.total} tone="blue" meta="Registered accounts" />
            <StatCard label="Total Assets" value={summary.assets.total} tone="green" meta="Tracked equipment" />
            <StatCard label="Hardware Requests" value={summary.tickets.total} tone="amber" meta="Service workflow" />
            <StatCard label="Low Stock Items" value={summary.inventory.lowStockCount} tone="red" meta="Needs attention" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="dashboard-panel p-5">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <p className="page-eyebrow mb-1">Requests</p>
                <h3 className="text-lg font-black text-slate-950">Lifecycle Overview</h3>
              </div>
              <div className="status-list">
                <StatusRow label="Submitted" value={summary.tickets.submitted} tone="blue" />
                <StatusRow label="Acknowledged" value={summary.tickets.acknowledged} tone="violet" />
                <StatusRow label="Under Review" value={summary.tickets.underReview} tone="amber" />
                <StatusRow label="In Procurement" value={summary.tickets.procurement} tone="red" />
                <StatusRow label="Item Available" value={summary.tickets.itemAvailable} tone="green" />
                <StatusRow label="Installation Scheduled" value={summary.tickets.installationScheduled} tone="amber" />
                <StatusRow label="Installed" value={summary.tickets.installed} tone="green" />
                <StatusRow label="Closed" value={summary.tickets.closed} tone="slate" />
              </div>
            </section>

            <section className="dashboard-panel p-5">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <p className="page-eyebrow mb-1">Assets</p>
                <h3 className="text-lg font-black text-slate-950">Lifecycle Overview</h3>
              </div>
              <div className="status-list">
                <StatusRow label="Active" value={summary.assets.active} tone="green" />
                <StatusRow label="Under Repair" value={summary.assets.underRepair} tone="amber" />
                <StatusRow label="Damaged" value={summary.assets.damaged} tone="red" />
                <StatusRow label="Retired" value={summary.assets.retired} tone="slate" />
              </div>
            </section>
          </div>
        </>
      )}
    </Layout>
  );
}

function OperationsBoard({ summary }) {
  const [activeStage, setActiveStage] = useState("submitted");
  const activeTickets =
    summary.tickets.submitted +
    summary.tickets.acknowledged +
    summary.tickets.underReview +
    summary.tickets.procurement;

  const stageGroups = {
    submitted: {
      label: "Submitted",
      rows: [
        {
          description: "New hardware requests",
          reference: summary.tickets.submitted,
          owner: "Departments",
          queue: "Helpdesk",
          storage: "Intake",
          tone: "blue",
          status: "Pending",
        },
      ],
    },
    reviewed: {
      label: "Reviewed",
      rows: [
        {
          description: "Acknowledged requests",
          reference: summary.tickets.acknowledged,
          owner: "Helpdesk",
          queue: "Approvals",
          storage: "Workflow",
          tone: "violet",
          status: "Reviewed",
        },
        {
          description: "Under review",
          reference: summary.tickets.underReview,
          owner: "Head of IT",
          queue: "Approvals",
          storage: "Workflow",
          tone: "amber",
          status: "Processing",
        },
      ],
    },
    procurement: {
      label: "Procurement",
      rows: [
        {
          description: "Procurement queue",
          reference: summary.tickets.procurement,
          owner: "Procurement",
          queue: "Supply",
          storage: "Orders",
          tone: "red",
          status: "Action",
        },
      ],
    },
    finished: {
      label: "Finished",
      rows: [
        {
          description: "Installed requests",
          reference: summary.tickets.installed,
          owner: "Technicians",
          queue: "Field work",
          storage: "Archive",
          tone: "green",
          status: "Finished",
        },
        {
          description: "Closed requests",
          reference: summary.tickets.closed,
          owner: "Technicians",
          queue: "Closed",
          storage: "Archive",
          tone: "slate",
          status: "Closed",
        },
      ],
    },
  };
  const activeRows = stageGroups[activeStage].rows;

  return (
    <section className="board-panel">
      <div className="board-inner">
        <div className="board-toolbar">
          <div>
            <p className="page-eyebrow">Service control</p>
            <h3 className="board-title">Hardware Request Board</h3>
          </div>
          <div className="status-legend">
            <span className="legend-dot" style={{ "--dot": "#efb94e" }}>Pending</span>
            <span className="legend-dot" style={{ "--dot": "#44b88a" }}>Processing</span>
            <span className="legend-dot" style={{ "--dot": "#df6e75" }}>Needs action</span>
          </div>
        </div>

        <div className="board-filters">
          <div className="faux-search">Search request, department, hardware or owner</div>
          <div className="date-chip">Active queue: {activeTickets}</div>
        </div>

        <div className="segment-tabs" aria-label="Request workflow summary">
          {Object.entries(stageGroups).map(([stageKey, stage]) => (
            <button
              type="button"
              key={stageKey}
              className={activeStage === stageKey ? "is-active" : ""}
              onClick={() => setActiveStage(stageKey)}
              aria-pressed={activeStage === stageKey}
            >
              {stage.label}
            </button>
          ))}
        </div>

        <div className="preview-table-wrap">
          <table className="preview-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Count</th>
                <th>Owner</th>
                <th>Queue</th>
                <th>Storage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row) => (
                <tr key={row.description}>
                  <td className="font-black text-[#1d2a55]">{row.description}</td>
                  <td>{row.reference}</td>
                  <td>{row.owner}</td>
                  <td>{row.queue}</td>
                  <td>{row.storage}</td>
                  <td>
                    <span className={`badge badge-${row.tone}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        

       
      </div>
    </section>
  );
}

function StatusRow({ label, value, tone }) {
  const tones = {
    blue: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="status-row">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className={`rounded-full px-3 py-1 text-sm font-black ${tones[tone]}`}>
        {value}
      </span>
    </div>
  );
}

export default Dashboard;
