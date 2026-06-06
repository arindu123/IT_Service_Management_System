import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function CreateRepair() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ticketId: "",
    diagnosis: "",
    notes: "",
    repairStatus: "in_progress",
    completionDate: "",
    itemName: "",
    quantity: "",
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

      const payload = {
        ticketId: formData.ticketId,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
        repairStatus: formData.repairStatus,
        completionDate: formData.completionDate || null,
        replacedParts:
          formData.itemName && formData.quantity
            ? [
                {
                  itemName: formData.itemName,
                  quantity: Number(formData.quantity),
                },
              ]
            : [],
      };

      await API.post("/repairs", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/repairs");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create repair record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Create Repair Record
        </h2>
        <p className="text-gray-500">
          Add diagnosis, replaced parts and repair status
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <input
            name="ticketId"
            value={formData.ticketId}
            onChange={handleChange}
            placeholder="Ticket ID e.g. TCK-002"
            className="border rounded-lg px-4 py-2"
            required
          />

          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            placeholder="Diagnosis"
            className="border rounded-lg px-4 py-2"
            rows="4"
            required
          />

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Repair Notes"
            className="border rounded-lg px-4 py-2"
            rows="3"
          />

          <select
            name="repairStatus"
            value={formData.repairStatus}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            name="completionDate"
            value={formData.completionDate}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="Replaced Part Name"
              className="border rounded-lg px-4 py-2"
            />

            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Quantity"
              className="border rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 disabled:bg-blue-400"
            >
              {loading ? "Saving..." : "Save Repair"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/repairs")}
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

export default CreateRepair;