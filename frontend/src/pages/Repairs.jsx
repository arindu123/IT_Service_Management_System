import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Button, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

const REPAIR_FIELDS = [
  { label: "RR Number", key: "rrNumber" },
  { label: "Type", key: "type", format: formatNameValue },
  { label: "Model", key: "model", format: formatNameValue },
  { label: "Serial Number", key: "serialNumber" },
  { label: "User Name", key: "userName" },
  { label: "Office", key: "office" },
  { label: "Received Date", key: "receivedDate", format: formatDate },
  { label: "Error Description", key: "errorDescription", wide: true },
  { label: "Service Printer", key: "servicePrinter" },
  { label: "Service Date", key: "serviceDate", format: formatDate },
  { label: "Return Situation", key: "returnSituation" },
  { label: "Return Date", key: "returnDate", format: formatDate },
  { label: "Special Note", key: "specialNote", wide: true },
];

function Repairs() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [repairs, setRepairs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const filteredRepairs = repairs.filter((r) =>
    Object.values(r).some(
      (val) => val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/repairs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRepairs(response.data.repairs || []);
      } catch (err) {
        setError(err.response?.data?.message || t("repairs.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchRepairs();
  }, [t]);

  const handleDeleteRepair = async (repair) => {
    const repairLabel = repair.rrNumber || repair.repairId || "this repair";

    if (!window.confirm(`Delete ${repairLabel}? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setDeletingId(repair._id);

    try {
      const token = localStorage.getItem("token");

      await API.delete(`/repairs/${repair._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRepairs((currentRepairs) => currentRepairs.filter((item) => item._id !== repair._id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete repair record");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <Layout>
      <PageHeader
        eyebrow={t("repairs.eyebrow")}
        title={t("repairs.title")}
        description={t("repairs.description")}
        action={<Button type="button" onClick={() => navigate("/repairs/create")}>{t("common.addRepair")}</Button>}
      />

      <Alert message={error} />

      <section className="repair-register">
        <div className="repair-register-toolbar">
          <div>
            <p className="table-label">{t("common.records", { count: filteredRepairs.length })}</p>
            <h3 className="table-title">{t("repairs.tableTitle")}</h3>
          </div>
          <input
            type="text"
            placeholder="Search repairs..."
            className="repair-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="repair-empty-state">{t("common.loading")}</div>
        ) : filteredRepairs.length === 0 ? (
          <div className="repair-empty-state">{t("repairs.empty")}</div>
        ) : (
          <div className="repair-card-list">
            {filteredRepairs.map((repair) => (
              <article key={repair._id} className="repair-card">
                <div className="repair-card-header">
                  <div className="repair-identity">
                    <span className="repair-mark">{getRepairMark(repair.type)}</span>
                    <div className="repair-card-title">
                      <p>Repair Record</p>
                      <h3>{formatValue(repair.rrNumber)}</h3>
                      <span>{formatNameValue(repair.model)} | {formatValue(repair.serialNumber)}</span>
                    </div>
                  </div>

                  <div className="repair-actions">
                    <button
                      type="button"
                      className="repair-action-button"
                      onClick={() => navigate(`/repairs/${repair._id}/edit`)}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="repair-action-button repair-action-danger"
                      onClick={() => handleDeleteRepair(repair)}
                      disabled={deletingId === repair._id}
                    >
                      {deletingId === repair._id ? t("common.deleting") : t("common.delete")}
                    </button>
                  </div>
                </div>

                <div className="repair-summary-grid">
                  <SummaryTile label="Type" value={formatNameValue(repair.type)} />
                  <SummaryTile label="User" value={formatValue(repair.userName)} />
                  <SummaryTile label="Received" value={formatDate(repair.receivedDate)} />
                </div>

                <div className="repair-detail-grid">
                  {REPAIR_FIELDS.map((field) => (
                    <DetailItem
                      key={field.key}
                      label={field.label}
                      value={(field.format || formatValue)(repair[field.key])}
                      wide={field.wide}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="repair-summary-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={`repair-detail-item ${wide ? "repair-detail-wide" : ""}`}>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") return "N/A";
  return value;
}

function formatNameValue(value) {
  const text = formatValue(value);
  if (text === "N/A") return text;

  return String(text)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRepairMark(type) {
  const label = formatNameValue(type);
  if (label === "N/A") return "RP";

  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default Repairs;
