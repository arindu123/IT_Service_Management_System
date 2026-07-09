import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function CreateRepair() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();

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
      setError(err.response?.data?.message || t("repairs.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("repairs.newEyebrow")}
        title={t("repairs.createTitle")}
        description={t("repairs.createDescription")}
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <Field label={t("labels.hardwareRequestId")}>
            <input name="ticketId" value={formData.ticketId} onChange={handleChange} placeholder={t("placeholders.ticketId")} required />
          </Field>

          <Field label={t("labels.diagnosis")}>
            <textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} placeholder={t("placeholders.diagnosis")} rows="4" required />
          </Field>

          <Field label={t("labels.repairNotes")}>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder={t("placeholders.repairNotes")} rows="3" />
          </Field>

          <Field label={t("labels.repairStatus")}>
            <select name="repairStatus" value={formData.repairStatus} onChange={handleChange}>
              <option value="pending">{enumLabel("repairStatus", "pending")}</option>
              <option value="in_progress">{enumLabel("repairStatus", "in_progress")}</option>
              <option value="completed">{enumLabel("repairStatus", "completed")}</option>
              <option value="failed">{enumLabel("repairStatus", "failed")}</option>
            </select>
          </Field>

          <Field label={t("labels.completionDate")}>
            <input type="date" name="completionDate" value={formData.completionDate} onChange={handleChange} />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("labels.replacedPartName")}>
              <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder={t("placeholders.partName")} />
            </Field>

            <Field label={t("labels.quantity")}>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder={t("placeholders.quantity")} />
            </Field>
          </div>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? t("common.saving") : t("common.saveRepair")}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/repairs")}>{t("common.cancel")}</Button>
          </FormActions>
        </form>
      </FormPanel>
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default CreateRepair;
