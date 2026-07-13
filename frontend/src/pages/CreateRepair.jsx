import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, FormActions, FormPanel, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

const TYPE_OPTIONS = [
  { value: "ups", label: "UPS" },
  { value: "printer", label: "Printer" },
  { value: "monitor", label: "Monitor" },
  { value: "cpu", label: "CPU" },
];

const MODEL_OPTIONS = [
  { value: "canon", label: "Canon" },
  { value: "dell", label: "Dell" },
  { value: "lenovo", label: "Lenovo" },
  { value: "hp", label: "HP" },
  { value: "dcd", label: "DCD" },
  { value: "epson_m100", label: "Epson M100" },
];

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function buildAutoRrNumber() {
  const now = new Date();
  const year = now.getFullYear();

  return `RR/${year}/001`;
}

function getEmptyFormData() {
  return {
    rrNumber: buildAutoRrNumber(),
    type: "",
    typeOther: "",
    model: "",
    modelOther: "",
    serialNumber: "",
    userName: "",
    office: "",
    receivedDate: getTodayInputValue(),
    errorDescription: "",
    servicePrinter: "",
    serviceDate: "",
    returnSituation: "",
    returnDate: "",
    specialNote: "",
  };
}

function getSelectState(value, options) {
  if (!value) {
    return { selected: "", other: "" };
  }

  if (options.some((option) => option.value === value)) {
    return { selected: value, other: "" };
  }

  return { selected: "other", other: value };
}

function repairToFormData(repair) {
  const typeState = getSelectState(repair.type, TYPE_OPTIONS);
  const modelState = getSelectState(repair.model, MODEL_OPTIONS);

  return {
    rrNumber: repair.rrNumber || "",
    type: typeState.selected,
    typeOther: typeState.other,
    model: modelState.selected,
    modelOther: modelState.other,
    serialNumber: repair.serialNumber || "",
    userName: repair.userName || "",
    office: repair.office || "",
    receivedDate: toDateInputValue(repair.receivedDate),
    errorDescription: repair.errorDescription || "",
    servicePrinter: repair.servicePrinter || "",
    serviceDate: toDateInputValue(repair.serviceDate),
    returnSituation: repair.returnSituation || "",
    returnDate: toDateInputValue(repair.returnDate),
    specialNote: repair.specialNote || "",
  };
}

function buildRepairPayload(formData) {
  return {
    rrNumber: formData.rrNumber,
    type: formData.type === "other" ? formData.typeOther : formData.type,
    model: formData.model === "other" ? formData.modelOther : formData.model,
    serialNumber: formData.serialNumber,
    userName: formData.userName,
    office: formData.office,
    receivedDate: formData.receivedDate || null,
    errorDescription: formData.errorDescription,
    servicePrinter: formData.servicePrinter,
    serviceDate: formData.serviceDate || null,
    returnSituation: formData.returnSituation,
    returnDate: formData.returnDate || null,
    specialNote: formData.specialNote,
  };
}

function CreateRepair() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(getEmptyFormData);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRepair, setLoadingRepair] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) return;

    const fetchNextRrNumber = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await API.get("/repairs/next-rr", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.rrNumber) {
          setFormData((current) => ({
            ...current,
            rrNumber: response.data.rrNumber,
          }));
        }
      } catch {
        setFormData((current) => ({
          ...current,
          rrNumber: buildAutoRrNumber(),
        }));
      }
    };

    fetchNextRrNumber();
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchRepair = async () => {
      setError("");
      setLoadingRepair(true);

      try {
        const token = localStorage.getItem("token");
        const response = await API.get(`/repairs/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setFormData(repairToFormData(response.data));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load repair record");
      } finally {
        setLoadingRepair(false);
      }
    };

    fetchRepair();
  }, [id, isEditMode]);

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
      const payload = buildRepairPayload(formData);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (isEditMode) {
        await API.put(`/repairs/${id}`, payload, config);
      } else {
        await API.post("/repairs", payload, config);
      }

      navigate("/repairs");
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? "Failed to update repair record" : t("repairs.createError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={isEditMode ? "Repair update" : t("repairs.newEyebrow")}
        title={isEditMode ? "Update Repair Record" : t("repairs.createTitle")}
        description={isEditMode ? "Edit the saved repair details and service outcome." : t("repairs.createDescription")}
      />

      <FormPanel>
        <Alert message={error} />

        {loadingRepair ? (
          <div className="py-8 text-center text-sm font-bold text-[#62709a]">{t("common.loading")}</div>
        ) : (
          <form onSubmit={handleSubmit} className="form-grid">
            <Field label="RR Number">
              <input name="rrNumber" value={formData.rrNumber} disabled className="bg-slate-100" />
            </Field>

            <Field label="Type">
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="">Select Type</option>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                <option value="other">Other</option>
              </select>
              {formData.type === "other" && (
                <input name="typeOther" placeholder="Enter type" value={formData.typeOther} onChange={handleChange} className="mt-2" />
              )}
            </Field>

            <Field label="Model">
              <select name="model" value={formData.model} onChange={handleChange}>
                <option value="">Select Model</option>
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                <option value="other">Other</option>
              </select>
              {formData.model === "other" && (
                <input name="modelOther" placeholder="Enter model" value={formData.modelOther} onChange={handleChange} className="mt-2" />
              )}
            </Field>

            <Field label="Serial Number">
              <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="Enter Serial Number" />
            </Field>

            <Field label="User Name">
              <input name="userName" value={formData.userName} onChange={handleChange} placeholder="Enter User Name" />
            </Field>

            <Field label="Office">
              <input name="office" value={formData.office} onChange={handleChange} placeholder="Enter Office" />
            </Field>

            <Field label="Received Date">
              <input type="date" name="receivedDate" value={formData.receivedDate} onChange={handleChange} />
            </Field>

            <Field label="Error Description" wide>
              <textarea name="errorDescription" value={formData.errorDescription} onChange={handleChange} placeholder="Enter Error" rows="3" />
            </Field>

            <Field label="Service Printer">
              <input name="servicePrinter" value={formData.servicePrinter} onChange={handleChange} placeholder="Enter Service Printer" />
            </Field>

            <Field label="Service Date">
              <input type="date" name="serviceDate" value={formData.serviceDate} onChange={handleChange} />
            </Field>

            <Field label="Return Situation">
              <input name="returnSituation" value={formData.returnSituation} onChange={handleChange} placeholder="Enter Return Situation" />
            </Field>

            <Field label="Return Date">
              <input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} />
            </Field>

            <Field label="Special Note" wide>
              <textarea name="specialNote" value={formData.specialNote} onChange={handleChange} placeholder="Enter Special Note" rows="3" />
            </Field>

            <FormActions>
              <Button type="submit" disabled={loading}>
                {loading ? t("common.saving") : isEditMode ? t("common.saveChanges") : t("common.saveRepair")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/repairs")}>{t("common.cancel")}</Button>
            </FormActions>
          </form>
        )}
      </FormPanel>
    </Layout>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <div className={`field ${wide ? "md:col-span-2" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export default CreateRepair;
