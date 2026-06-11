import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";

function CreateTicket() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    assetId: "",
    issueDescription: "",
    priority: "medium",
    department: "",
    remarks: "",
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

      await API.post("/tickets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="New request"
        title="Create Ticket"
        description="Report an IT support issue and assign the correct operational priority."
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <Field label="Asset ID">
            <input name="assetId" value={formData.assetId} onChange={handleChange} placeholder="AST-001" required />
          </Field>

          <Field label="Issue Description">
            <textarea name="issueDescription" value={formData.issueDescription} onChange={handleChange} placeholder="Describe the issue" rows="4" required />
          </Field>

          <Field label="Priority">
            <select name="priority" value={formData.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>

          <Field label="Department">
            <input name="department" value={formData.department} onChange={handleChange} placeholder="Department" required />
          </Field>

          <Field label="Remarks">
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Optional remarks" rows="3" />
          </Field>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Ticket"}</Button>
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
