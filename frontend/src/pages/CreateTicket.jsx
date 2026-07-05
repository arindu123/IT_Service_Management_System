import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";

function CreateTicket() {
  const navigate = useNavigate();
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
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="Hardware request"
        title="Submit Helpdesk Request"
        description="Create a traceable hardware fault, replacement, upgrade or procurement request for Head of IT review."
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Requester Profile
            </p>
            <div className="form-grid">
              <Field label="Employee ID">
                <input value={user.employeeId || "Not assigned"} disabled />
              </Field>
              <Field label="Employee Name">
                <input value={user.name || "Current user"} disabled />
              </Field>
              <Field label="Department">
                <input value={user.department || formData.department || "Unassigned"} disabled />
              </Field>
              <Field label="Contact">
                <input value={user.phone || user.email || "Not available"} disabled />
              </Field>
            </div>
          </section>

          <div className="form-grid">
            <Field label="Request Type">
              <select name="requestType" value={formData.requestType} onChange={handleChange} required>
                <option value="fault">Faulty Hardware</option>
                <option value="replacement">Replacement</option>
                <option value="upgrade">Upgrade</option>
                <option value="performance_issue">Performance Issue</option>
                <option value="procurement">Procurement Request</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Hardware Category">
              <select name="hardwareCategory" value={formData.hardwareCategory} onChange={handleChange} required>
                <option value="monitor">Monitor</option>
                <option value="mouse">Mouse</option>
                <option value="keyboard">Keyboard</option>
                <option value="ram">RAM</option>
                <option value="storage">Storage</option>
                <option value="cpu">CPU</option>
                <option value="printer">Printer</option>
                <option value="laptop_desktop">Laptop / Desktop</option>
                <option value="network_device">Network Device</option>
                <option value="scanner">Scanner</option>
                <option value="accessories">Accessories</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Linked Asset ID">
              <input name="assetId" value={formData.assetId} onChange={handleChange} placeholder="AST-001" />
            </Field>

            <Field label="Asset Tag / Serial">
              <input
                name="currentAssetTag"
                value={formData.currentAssetTag}
                onChange={handleChange}
                placeholder="Asset tag or serial number"
              />
            </Field>

            <Field label="Priority">
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>

            <Field label="Preferred Installation Time">
              <input
                type="datetime-local"
                name="preferredInstallationTime"
                value={formData.preferredInstallationTime}
                onChange={handleChange}
              />
            </Field>
          </div>

          <Field label="Issue Description">
            <textarea
              name="issueDescription"
              value={formData.issueDescription}
              onChange={handleChange}
              placeholder="Describe the issue, urgency and affected hardware"
              rows="4"
              required
            />
          </Field>

          <Field label="Business Impact">
            <textarea
              name="businessImpact"
              value={formData.businessImpact}
              onChange={handleChange}
              placeholder="Example: unable to work, frequent restarts, display not working"
              rows="3"
            />
          </Field>

          <Field label="Requested Specification">
            <input
              name="requestedSpecification"
              value={formData.requestedSpecification}
              onChange={handleChange}
              placeholder="Example: additional 8GB RAM, replacement monitor, new mouse"
            />
          </Field>

          <Field label="Remarks">
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional remarks" rows="3" />
          </Field>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black text-slate-900">Supporting Evidence</p>
                <p className="text-xs font-semibold text-slate-500">JPG, PNG, PDF, MP4, MOV or WebM; 20 MB per file.</p>
              </div>
              {files.length > 0 && (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                  {files.length} selected
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
            <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Request"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/tickets")}>Cancel</Button>
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
