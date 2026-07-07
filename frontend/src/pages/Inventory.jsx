import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";

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
      <PageHeader
        eyebrow="Stock control"
        title="IT Inventory Management"
        description="Review spare parts, reorder thresholds, unit cost and stock availability."
        action={<Button type="button" onClick={() => navigate("/inventory/add")}>Add Item</Button>}
      />

      <Alert message={error} />

      <DataTable
        metric={`${items.length} records`}
        emptyLabel="IT Inventory Items"
        emptyMessage="No inventory items found"
        columns={["Item Name", "Category", "Quantity", "Reorder Level", "Unit Price", "Stock Status"]}
      >
        {items.length === 0 ? (
          <EmptyRow colSpan="6" message="No inventory items found" />
        ) : (
          items.map((item) => {
            const isLowStock = item.quantity <= item.reorderLevel;

            return (
              <tr key={item._id} className={isLowStock ? "bg-red-50/50" : ""}>
                <td className="font-black text-slate-950">{item.itemName}</td>
                <td>
                  <Badge tone="slate">{formatLabel(item.category)}</Badge>
                </td>
                <td className="font-black text-slate-900">{item.quantity}</td>
                <td>{item.reorderLevel}</td>
                <td className="font-bold">Rs. {item.unitPrice?.toFixed(2) || "0.00"}</td>
                <td>
                  <Badge tone={isLowStock ? "red" : "green"}>
                    {isLowStock ? "Low Stock" : "Available"}
                  </Badge>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>
    </Layout>
  );
}

function formatLabel(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default Inventory;
