import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function AddAsset() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();

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
      setError(err.response?.data?.message || t("assets.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("assets.newEyebrow")}
        title={t("assets.addTitle")}
        description={t("assets.addDescription")}
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="form-grid">
          <Field label={t("labels.assetId")}>
            <input name="assetId" value={formData.assetId} onChange={handleChange} placeholder={t("placeholders.assetId")} required />
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

          <Field label={t("labels.location")}>
            <input name="location" value={formData.location} onChange={handleChange} placeholder={t("placeholders.location")} required />
          </Field>

          <Field label={t("labels.department")}>
            <input name="department" value={formData.department} onChange={handleChange} placeholder={t("placeholders.department")} required />
          </Field>

          <Field label={t("labels.warrantyDate")}>
            <input type="date" name="warrantyDate" value={formData.warrantyDate} onChange={handleChange} />
          </Field>

          <Field label={t("labels.notes")} className="md:col-span-2">
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t("placeholders.assetNotes")} />
          </Field>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? t("common.saving") : t("common.saveAsset")}</Button>
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
