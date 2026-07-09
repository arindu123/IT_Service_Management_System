import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function CreateTicket() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [formData, setFormData] = useState({
    assetId: "",
    requestType: "fault",
    hardwareCategory: "monitor",
    currentAssetTag: "",
    issueDescription: "",
    businessImpact: "",
    requestedSpecification: "",
    priority: "medium",
    department: user.department || "",
    preferredInstallationTime: "",
    remarks: "",
  });

  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await API.post("/tickets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (files.length > 0) {
        const uploadData = new FormData();
        files.forEach((file) => uploadData.append("attachments", file));

        await API.post(`/tickets/${response.data.ticket._id}/attachments`, uploadData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || t("tickets.submitError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("tickets.createEyebrow")}
        title={t("tickets.createTitle")}
        description={t("tickets.createDescription")}
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {t("tickets.requesterProfile")}
            </p>
            <div className="form-grid">
              <Field label={t("labels.employeeId")}>
                <input value={user.employeeId || t("common.notAssigned")} disabled />
              </Field>
              <Field label={t("labels.name")}>
                <input value={user.name || t("common.currentUser")} disabled />
              </Field>
              <Field label={t("labels.department")}>
                <input value={user.department || formData.department || t("common.unassigned")} disabled />
              </Field>
              <Field label={t("labels.contact")}>
                <input value={user.phone || user.email || t("common.notAvailable")} disabled />
              </Field>
            </div>
          </section>

          <div className="form-grid">
            <Field label={t("labels.requestType")}>
              <select name="requestType" value={formData.requestType} onChange={handleChange} required>
                <option value="fault">{enumLabel("requestType", "fault")}</option>
                <option value="replacement">{enumLabel("requestType", "replacement")}</option>
                <option value="upgrade">{enumLabel("requestType", "upgrade")}</option>
                <option value="performance_issue">{enumLabel("requestType", "performance_issue")}</option>
                <option value="procurement">{enumLabel("requestType", "procurement")}</option>
                <option value="other">{enumLabel("requestType", "other")}</option>
              </select>
            </Field>

            <Field label={t("labels.hardwareCategory")}>
              <select name="hardwareCategory" value={formData.hardwareCategory} onChange={handleChange} required>
                <option value="monitor">{enumLabel("hardwareCategory", "monitor")}</option>
                <option value="mouse">{enumLabel("hardwareCategory", "mouse")}</option>
                <option value="keyboard">{enumLabel("hardwareCategory", "keyboard")}</option>
                <option value="ram">{enumLabel("hardwareCategory", "ram")}</option>
                <option value="storage">{enumLabel("hardwareCategory", "storage")}</option>
                <option value="cpu">{enumLabel("hardwareCategory", "cpu")}</option>
                <option value="printer">{enumLabel("hardwareCategory", "printer")}</option>
                <option value="laptop_desktop">{enumLabel("hardwareCategory", "laptop_desktop")}</option>
                <option value="network_device">{enumLabel("hardwareCategory", "network_device")}</option>
                <option value="scanner">{enumLabel("hardwareCategory", "scanner")}</option>
                <option value="accessories">{enumLabel("hardwareCategory", "accessories")}</option>
                <option value="other">{enumLabel("hardwareCategory", "other")}</option>
              </select>
            </Field>

            <Field label={t("labels.linkedAssetId")}>
              <input name="assetId" value={formData.assetId} onChange={handleChange} placeholder={t("placeholders.assetId")} />
            </Field>

            <Field label={t("labels.assetTagSerial")}>
              <input
                name="currentAssetTag"
                value={formData.currentAssetTag}
                onChange={handleChange}
                placeholder={t("placeholders.assetTagSerial")}
              />
            </Field>

            <Field label={t("labels.priority")}>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">{enumLabel("priority", "low")}</option>
                <option value="medium">{enumLabel("priority", "medium")}</option>
                <option value="high">{enumLabel("priority", "high")}</option>
                <option value="critical">{enumLabel("priority", "critical")}</option>
              </select>
            </Field>

            <Field label={t("labels.preferredInstallationTime")}>
              <input
                type="datetime-local"
                name="preferredInstallationTime"
                value={formData.preferredInstallationTime}
                onChange={handleChange}
              />
            </Field>
          </div>

          <Field label={t("labels.issueDescription")}>
            <textarea
              name="issueDescription"
              value={formData.issueDescription}
              onChange={handleChange}
              placeholder={t("placeholders.issueDescription")}
              rows="4"
              required
            />
          </Field>

          <Field label={t("labels.businessImpact")}>
            <textarea
              name="businessImpact"
              value={formData.businessImpact}
              onChange={handleChange}
              placeholder={t("placeholders.businessImpact")}
              rows="3"
            />
          </Field>

          <Field label={t("labels.requestedSpecification")}>
            <input
              name="requestedSpecification"
              value={formData.requestedSpecification}
              onChange={handleChange}
              placeholder={t("placeholders.requestedSpecification")}
            />
          </Field>

          <Field label={t("labels.remarks")}>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder={t("placeholders.remarks")} rows="3" />
          </Field>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black text-slate-900">{t("labels.supportingEvidence")}</p>
                <p className="text-xs font-semibold text-slate-500">{t("tickets.supportingEvidenceDescription")}</p>
              </div>
              {files.length > 0 && (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                  {t("common.selectedCount", { count: files.length })}
                </span>
              )}
            </div>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.webm"
              onChange={handleFiles}
            />
          </section>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? t("common.submitting") : t("tickets.submitRequest")}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/tickets")}>{t("common.cancel")}</Button>
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

export default CreateTicket;
