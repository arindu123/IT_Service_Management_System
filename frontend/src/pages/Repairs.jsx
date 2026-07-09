import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function Repairs() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();

  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/repairs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRepairs(response.data.repairs);
      } catch (err) {
        setError(err.response?.data?.message || t("repairs.loadError"));
      }
    };

    fetchRepairs();
  }, []);

  return (
    <Layout>
      <PageHeader
        eyebrow={t("repairs.eyebrow")}
        title={t("repairs.title")}
        description={t("repairs.description")}
        action={<Button type="button" onClick={() => navigate("/repairs/create")}>{t("common.addRepair")}</Button>}
      />

      <Alert message={error} />

      <DataTable
        metric={t("common.records", { count: repairs.length })}
        emptyLabel={t("repairs.tableTitle")}
        emptyMessage={t("repairs.empty")}
        columns={[t("labels.repairId"), t("labels.request"), t("labels.asset"), t("labels.diagnosis"), t("labels.technician"), t("labels.status")]}
      >
        {repairs.length === 0 ? (
          <EmptyRow colSpan="6" message={t("repairs.empty")} />
        ) : (
          repairs.map((repair) => (
            <tr key={repair._id}>
              <td className="font-black text-slate-950">{repair.repairId}</td>
              <td className="font-bold">{repair.ticket?.ticketId || t("common.notAvailable")}</td>
              <td>
                <div className="font-bold text-slate-800">{repair.asset?.assetId || t("common.notAvailable")}</div>
                <div className="text-xs text-slate-500">
                  {repair.asset?.brand} {repair.asset?.model}
                </div>
              </td>
              <td className="max-w-xs">
                <div className="truncate">{repair.diagnosis || t("common.notSpecified")}</div>
              </td>
              <td>
                {repair.technician?.name ? (
                  <PersonName name={repair.technician.name} />
                ) : (
                  <span className="text-slate-400">{t("repairs.notAvailable")}</span>
                )}
              </td>
              <td>
                <Badge tone={repairTone(repair.repairStatus)}>
                  {enumLabel("repairStatus", repair.repairStatus)}
                </Badge>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </Layout>
  );
}

function PersonName({ name }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
        {initials}
      </span>
      <span className="font-semibold text-slate-700">{name}</span>
    </div>
  );
}

function repairTone(status) {
  if (status === "completed") return "green";
  if (status === "failed") return "red";
  if (status === "in_progress") return "amber";
  return "blue";
}

export default Repairs;
