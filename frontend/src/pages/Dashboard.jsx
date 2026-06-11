import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, PageHeader, StatCard } from "../components/ui";

function Dashboard() {
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
            title="Dashboard Summary"
            description="A live view of users, assets, tickets and inventory alerts across GSMB IT services."
          />

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={summary.users.total} tone="blue" meta="Registered accounts" />
            <StatCard label="Total Assets" value={summary.assets.total} tone="green" meta="Tracked equipment" />
            <StatCard label="Total Tickets" value={summary.tickets.total} tone="amber" meta="Support requests" />
            <StatCard label="Low Stock Items" value={summary.inventory.lowStockCount} tone="red" meta="Needs attention" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="dashboard-panel p-5">
              <div className="mb-4 border-b border-slate-100 pb-4">
                <p className="page-eyebrow mb-1">Tickets</p>
                <h3 className="text-lg font-black text-slate-950">Status Overview</h3>
              </div>
              <div className="status-list">
                <StatusRow label="Open" value={summary.tickets.open} tone="blue" />
                <StatusRow label="Assigned" value={summary.tickets.assigned} tone="violet" />
                <StatusRow label="In Progress" value={summary.tickets.inProgress} tone="amber" />
                <StatusRow label="Resolved" value={summary.tickets.resolved} tone="green" />
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
