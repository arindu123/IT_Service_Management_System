import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";

function Inventory() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/inventory", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setItems(response.data.items);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load inventory");
      }
    };

    fetchInventory();
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
          <p className="text-gray-500">Manage spare parts and IT stock</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/inventory/add")}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          Add Item
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
              <th className="p-4">Item Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Reorder Level</th>
              <th className="p-4">Unit Price</th>
              <th className="p-4">Stock Status</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No inventory items found
                </td>
              </tr>
            )}

            {items.map((item) => {
              const isLowStock = item.quantity <= item.reorderLevel;

              return (
                <tr key={item._id} className="border-t">
                  <td className="p-4 font-semibold">{item.itemName}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4">{item.reorderLevel}</td>
                  <td className="p-4">Rs. {item.unitPrice}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        isLowStock
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isLowStock ? "Low Stock" : "Available"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Inventory;