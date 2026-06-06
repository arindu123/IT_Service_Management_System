import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function AddAsset() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    assetId: "",
    serialNumber: "",
    deviceType: "laptop",
    brand: "",
    model: "",
    location: "",
    department: "",
    warrantyDate: "",
    status: "active",
    notes: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      await API.post("/assets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/assets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add Asset</h2>
        <p className="text-gray-500">Register a new IT device or equipment</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="assetId"
            value={formData.assetId}
            onChange={handleChange}
            placeholder="Asset ID"
            className="border rounded-lg px-4 py-2"
            required
          />

          <input
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            placeholder="Serial Number"
            className="border rounded-lg px-4 py-2"
            required
          />

          <select
            name="deviceType"
            value={formData.deviceType}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
          >
            <option value="computer">Computer</option>
            <option value="laptop">Laptop</option>
            <option value="printer">Printer</option>
            <option value="scanner">Scanner</option>
            <option value="network_device">Network Device</option>
            <option value="other">Other</option>
          </select>

          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="Brand"
            className="border rounded-lg px-4 py-2"
            required
          />

          <input
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="Model"
            className="border rounded-lg px-4 py-2"
            required
          />

          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            className="border rounded-lg px-4 py-2"
            required
          />

          <input
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Department"
            className="border rounded-lg px-4 py-2"
            required
          />

          <input
            type="date"
            name="warrantyDate"
            value={formData.warrantyDate}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
          />

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes"
            className="border rounded-lg px-4 py-2 md:col-span-2"
          />

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 disabled:bg-blue-400"
            >
              {loading ? "Saving..." : "Save Asset"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/assets")}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default AddAsset;