import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

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
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!summary && !error && (
        <p className="text-gray-600">Loading dashboard...</p>
      )}

      {summary && (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Dashboard Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">Total Users</p>
              <h3 className="text-3xl font-bold text-blue-700">
                {summary.users.total}
              </h3>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">Total Assets</p>
              <h3 className="text-3xl font-bold text-green-700">
                {summary.assets.total}
              </h3>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">Total Tickets</p>
              <h3 className="text-3xl font-bold text-orange-600">
                {summary.tickets.total}
              </h3>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-500 text-sm">Low Stock Items</p>
              <h3 className="text-3xl font-bold text-red-600">
                {summary.inventory.lowStockCount}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">Ticket Status</h3>

              <div className="space-y-2 text-gray-700">
                <p>Open: {summary.tickets.open}</p>
                <p>Assigned: {summary.tickets.assigned}</p>
                <p>In Progress: {summary.tickets.inProgress}</p>
                <p>Resolved: {summary.tickets.resolved}</p>
                <p>Closed: {summary.tickets.closed}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">Asset Status</h3>

              <div className="space-y-2 text-gray-700">
                <p>Active: {summary.assets.active}</p>
                <p>Under Repair: {summary.assets.underRepair}</p>
                <p>Damaged: {summary.assets.damaged}</p>
                <p>Retired: {summary.assets.retired}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Dashboard;