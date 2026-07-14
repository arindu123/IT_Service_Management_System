import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function AddAsset() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { enumLabel, t } = useTranslation();

  const [formData, setFormData] = useState({
    itemNumber: "",
    serialNumber: "",
    deviceType: "laptop",
    brand: "",
    model: "",
    productYear: "",
    generation: "",
    location: "",
    department: "",
    ministry: "",
    userId: "",
    userName: "",
    issueDate: "",
    warrantyDate: "",
    status: "active",
    notes: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const loadAsset = async () => {
      try {
        const response = await API.get(`/assets/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const asset = response.data;
        setFormData({
          itemNumber: asset.itemNumber || asset.assetId || "",
          serialNumber: asset.serialNumber || "",
          deviceType: asset.deviceType || "laptop",
          brand: asset.brand || "",
          model: asset.model || "",
          productYear: asset.productYear || "",
          generation: asset.generation || "",
          location: asset.location || "",
          department: asset.department || "",
          ministry: asset.ministry || "",
          userId: asset.userId || "",
          userName: asset.userName || "",
          issueDate: asset.issueDate ? asset.issueDate.slice(0, 10) : "",
          warrantyDate: asset.warrantyDate ? asset.warrantyDate.slice(0, 10) : "",
          status: asset.status || "active",
          notes: asset.notes || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Could not load this asset");
      }
    };

    loadAsset();
  }, [id, isEditing]);

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

      const request = isEditing ? API.put(`/assets/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      }) : API.post("/assets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await request;

      navigate("/assets");
    } catch (err) {
      setError(err.response?.data?.message || t("assets.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("assets.newEyebrow")}
        title={isEditing ? "Edit Asset" : t("assets.addTitle")}
        description={isEditing ? "Correct the item information, then save your changes." : t("assets.addDescription")}
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="form-grid">
          <Field label="Item Number">
            <input name="itemNumber" value={formData.itemNumber} onChange={handleChange} placeholder="e.g. IT-ITEM-001" required />
          </Field>

          <Field label={t("labels.serialNumber")}>
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder={t("placeholders.serialNumber")} required />
          </Field>

          <Field label={t("labels.deviceType")}>
            <select name="deviceType" value={formData.deviceType} onChange={handleChange}>
              <option value="computer">{enumLabel("deviceType", "computer")}</option>
              <option value="laptop">{enumLabel("deviceType", "laptop")}</option>
              <option value="printer">{enumLabel("deviceType", "printer")}</option>
              <option value="scanner">{enumLabel("deviceType", "scanner")}</option>
              <option value="network_device">{enumLabel("deviceType", "network_device")}</option>
              <option value="other">{enumLabel("deviceType", "other")}</option>
            </select>
          </Field>

          <Field label={t("labels.brand")}>
            <input name="brand" value={formData.brand} onChange={handleChange} placeholder={t("placeholders.brand")} required />
          </Field>

          <Field label={t("labels.model")}>
            <input name="model" value={formData.model} onChange={handleChange} placeholder={t("placeholders.model")} required />
          </Field>

          <Field label="Product Year">
            <input type="number" name="productYear" min="1900" max="2100" value={formData.productYear} onChange={handleChange} placeholder="e.g. 2024" />
          </Field>

          <Field label="Generation">
            <input name="generation" value={formData.generation} onChange={handleChange} placeholder="e.g. 12th Gen" />
          </Field>

          <Field label={t("labels.location")}>
            <input name="location" value={formData.location} onChange={handleChange} placeholder={t("placeholders.location")} required />
          </Field>

          <Field label={t("labels.department")}>
            <input name="department" value={formData.department} onChange={handleChange} placeholder={t("placeholders.department")} required />
          </Field>

          <Field label="Ministry">
            <input name="ministry" value={formData.ministry} onChange={handleChange} placeholder="Enter ministry" />
          </Field>

          <Field label="User ID">
            <input name="userId" value={formData.userId} onChange={handleChange} placeholder="Enter user ID" />
          </Field>

          <Field label="User Name">
            <input name="userName" value={formData.userName} onChange={handleChange} placeholder="Enter user name" />
          </Field>

          <Field label="Issue Date">
            <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} />
          </Field>

          <Field label={t("labels.warrantyDate")}>
            <input type="date" name="warrantyDate" value={formData.warrantyDate} onChange={handleChange} />
          </Field>

          <Field label={t("labels.notes")} className="md:col-span-2">
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t("placeholders.assetNotes")} />
          </Field>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? t("common.saving") : isEditing ? "Save Changes" : t("common.saveAsset")}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/assets")}>{t("common.cancel")}</Button>
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
