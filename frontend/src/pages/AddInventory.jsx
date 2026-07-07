import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";

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
      <PageHeader
        eyebrow="New stock item"
        title="Add IT Inventory Item"
        description="Add spare parts and consumables with reorder thresholds for stock control."
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="form-grid">
          <Field label="Item Name">
            <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Item name" required />
          </Field>

          <Field label="Category">
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="computer_parts">Computer Parts</option>
              <option value="printer_parts">Printer Parts</option>
              <option value="network_parts">Network Parts</option>
              <option value="cables">Cables</option>
              <option value="accessories">Accessories</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Quantity">
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
          </Field>

          <Field label="Reorder Level">
            <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} placeholder="Reorder level" required />
          </Field>

          <Field label="Unit Price">
            <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} placeholder="Unit price" />
          </Field>

          <Field label="Supplier Name">
            <input name="supplierName" value={formData.supplierName} onChange={handleChange} placeholder="Supplier name" />
          </Field>

          <Field label="Location">
            <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" />
          </Field>

          <Field label="Notes" className="md:col-span-2">
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Optional inventory notes" />
          </Field>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Item"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/inventory")}>Cancel</Button>
          </FormActions>
        </form>
      </FormPanel>
    </Layout>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`field ${className}`.trim()}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default AddInventory;
