import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function CreateTicket() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    assetId: "",
    issueDescription: "",
    priority: "medium",
    department: "",
    remarks: "",
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

      await API.post("/tickets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Ticket</h2>
        <p className="text-gray-500">Report a new IT support issue</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <input
            name="assetId"
            value={formData.assetId}
            onChange={handleChange}
            placeholder="Asset ID e.g. AST-001"
            className="border rounded-lg px-4 py-2"
            required
          />

          <textarea
            name="issueDescription"
            value={formData.issueDescription}
            onChange={handleChange}
            placeholder="Issue Description"
            className="border rounded-lg px-4 py-2"
            rows="4"
            required
          />

          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <input
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Department"
            className="border rounded-lg px-4 py-2"
            required
          />

          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Remarks"
            className="border rounded-lg px-4 py-2"
            rows="3"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 disabled:bg-blue-400"
            >
              {loading ? "Creating..." : "Create Ticket"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/tickets")}
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

export default CreateTicket;