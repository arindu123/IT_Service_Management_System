import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function AddInventory() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();

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
      setError(err.response?.data?.message || t("inventory.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("inventory.newEyebrow")}
        title={t("inventory.addTitle")}
        description={t("inventory.addDescription")}
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="form-grid">
          <Field label={t("labels.itemName")}>
            <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder={t("placeholders.itemName")} required />
          </Field>

          <Field label={t("labels.category")}>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="computer_parts">{enumLabel("inventoryCategory", "computer_parts")}</option>
              <option value="printer_parts">{enumLabel("inventoryCategory", "printer_parts")}</option>
              <option value="network_parts">{enumLabel("inventoryCategory", "network_parts")}</option>
              <option value="cables">{enumLabel("inventoryCategory", "cables")}</option>
              <option value="accessories">{enumLabel("inventoryCategory", "accessories")}</option>
              <option value="other">{enumLabel("inventoryCategory", "other")}</option>
            </select>
          </Field>

          <Field label={t("labels.quantity")}>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder={t("placeholders.quantity")} required />
          </Field>

          <Field label={t("labels.reorderLevel")}>
            <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} placeholder={t("placeholders.reorderLevel")} required />
          </Field>

          <Field label={t("labels.unitPrice")}>
            <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} placeholder={t("placeholders.unitPrice")} />
          </Field>

          <Field label={t("labels.supplierName")}>
            <input name="supplierName" value={formData.supplierName} onChange={handleChange} placeholder={t("placeholders.supplierName")} />
          </Field>

          <Field label={t("labels.location")}>
            <input name="location" value={formData.location} onChange={handleChange} placeholder={t("placeholders.location")} />
          </Field>

          <Field label={t("labels.notes")} className="md:col-span-2">
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t("placeholders.inventoryNotes")} />
          </Field>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? t("common.saving") : t("common.saveItem")}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/inventory")}>{t("common.cancel")}</Button>
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
