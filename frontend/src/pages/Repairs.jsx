import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function Repairs() {
  const navigate = useNavigate();

  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/repairs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRepairs(response.data.repairs);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load repairs");
      }
    };

    fetchRepairs();
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Repairs</h2>
          <p className="text-gray-500">View repair and maintenance history</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/repairs/create")}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          Add Repair
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-4">Repair ID</th>
              <th className="p-4">Ticket</th>
              <th className="p-4">Asset</th>
              <th className="p-4">Diagnosis</th>
              <th className="p-4">Technician</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {repairs.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No repair records found
                </td>
              </tr>
            )}

            {repairs.map((repair) => (
              <tr key={repair._id} className="border-t">
                <td className="p-4 font-semibold">{repair.repairId}</td>
                <td className="p-4">{repair.ticket?.ticketId}</td>
                <td className="p-4">
                  {repair.asset?.assetId} - {repair.asset?.brand}
                </td>
                <td className="p-4">{repair.diagnosis}</td>
                <td className="p-4">
                  {repair.technician?.name || "Not available"}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      repair.repairStatus === "completed"
                        ? "bg-green-100 text-green-700"
                        : repair.repairStatus === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {repair.repairStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Repairs;