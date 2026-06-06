import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function AddInventory() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itemName: "",
    category: "computer_parts",
    quantity: "",
    reorderLevel: "",
    unitPrice: "",
    supplierName: "",
    location: "IT Store",
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

      await API.post("/inventory", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/inventory");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create inventory item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Add Inventory Item
        </h2>
        <p className="text-gray-500">Add spare parts and IT stock items</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="Item Name"
            className="border rounded-lg px-4 py-2"
            required
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
          >
            <option value="computer_parts">Computer Parts</option>
            <option value="printer_parts">Printer Parts</option>
            <option value="network_parts">Network Parts</option>
            <option value="cables">Cables</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>

          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            className="border rounded-lg px-4 py-2"
            required
          />

          <input
            type="number"
            name="reorderLevel"
            value={formData.reorderLevel}
            onChange={handleChange}
            placeholder="Reorder Level"
            className="border rounded-lg px-4 py-2"
            required
          />

          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            placeholder="Unit Price"
            className="border rounded-lg px-4 py-2"
          />

          <input
            name="supplierName"
            value={formData.supplierName}
            onChange={handleChange}
            placeholder="Supplier Name"
            className="border rounded-lg px-4 py-2"
          />

          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
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
              {loading ? "Saving..." : "Save Item"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/inventory")}
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

export default AddInventory;