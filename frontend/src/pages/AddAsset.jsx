import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";

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
      <PageHeader
        eyebrow="New asset"
        title="Add Asset"
        description="Register a new IT device or equipment item in the asset register."
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="form-grid">
          <Field label="Asset ID">
            <input name="assetId" value={formData.assetId} onChange={handleChange} placeholder="AST-001" required />
          </Field>

          <Field label="Serial Number">
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="Serial number" required />
          </Field>

          <Field label="Device Type">
            <select name="deviceType" value={formData.deviceType} onChange={handleChange}>
              <option value="computer">Computer</option>
              <option value="laptop">Laptop</option>
              <option value="printer">Printer</option>
              <option value="scanner">Scanner</option>
              <option value="network_device">Network Device</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Brand">
            <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" required />
          </Field>

          <Field label="Model">
            <input name="model" value={formData.model} onChange={handleChange} placeholder="Model" required />
          </Field>

          <Field label="Location">
            <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
          </Field>

          <Field label="Department">
            <input name="department" value={formData.department} onChange={handleChange} placeholder="Department" required />
          </Field>

          <Field label="Warranty Date">
            <input type="date" name="warrantyDate" value={formData.warrantyDate} onChange={handleChange} />
          </Field>

          <Field label="Notes" className="md:col-span-2">
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Optional asset notes" />
          </Field>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Asset"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/assets")}>Cancel</Button>
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

export default AddAsset;
