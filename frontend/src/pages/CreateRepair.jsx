import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";

function CreateRepair() {
  const navigate = useNavigate();

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
      setError(err.response?.data?.message || "Failed to create repair record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="Repair workflow"
        title="Create Repair Record"
        description="Capture technician diagnosis, repair status and any replaced inventory parts."
      />

      <FormPanel>
        <Alert message={error} />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <Field label="Hardware Request ID">
            <input name="ticketId" value={formData.ticketId} onChange={handleChange} placeholder="TCK-002" required />
          </Field>

          <Field label="Diagnosis">
            <textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} placeholder="Diagnosis" rows="4" required />
          </Field>

          <Field label="Repair Notes">
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Optional repair notes" rows="3" />
          </Field>

          <Field label="Repair Status">
            <select name="repairStatus" value={formData.repairStatus} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </Field>

          <Field label="Completion Date">
            <input type="date" name="completionDate" value={formData.completionDate} onChange={handleChange} />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Replaced Part Name">
              <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Part name" />
            </Field>

            <Field label="Quantity">
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" />
            </Field>
          </div>

          <FormActions>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Repair"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/repairs")}>Cancel</Button>
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
