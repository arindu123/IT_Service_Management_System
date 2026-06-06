import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function Assets() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/assets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAssets(response.data.assets);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load assets");
      }
    };

    fetchAssets();
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assets</h2>
          <p className="text-gray-500">Manage IT devices and equipment</p>
        </div>

        <button
          onClick={() => navigate("/assets/add")}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          Add Asset
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
              <th className="p-4">Asset ID</th>
              <th className="p-4">Device</th>
              <th className="p-4">Brand</th>
              <th className="p-4">Model</th>
              <th className="p-4">Department</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {assets.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No assets found
                </td>
              </tr>
            )}

            {assets.map((asset) => (
              <tr key={asset._id} className="border-t">
                <td className="p-4 font-semibold">{asset.assetId}</td>
                <td className="p-4">{asset.deviceType}</td>
                <td className="p-4">{asset.brand}</td>
                <td className="p-4">{asset.model}</td>
                <td className="p-4">{asset.department}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      asset.status === "active"
                        ? "bg-green-100 text-green-700"
                        : asset.status === "under_repair"
                        ? "bg-orange-100 text-orange-700"
                        : asset.status === "damaged"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {asset.status}
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

export default Assets;