import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function Assets() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();

  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/assets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAssets(response.data.assets);
      } catch (err) {
        setError(err.response?.data?.message || t("assets.loadError"));
      }
    };

    fetchAssets();
  }, []);

  return (
    <Layout>
      <PageHeader
        eyebrow={t("assets.eyebrow")}
        title={t("assets.title")}
        description={t("assets.description")}
        action={<Button onClick={() => navigate("/assets/add")}>{t("common.addNewAsset")}</Button>}
      />

      <Alert message={error} />

      <DataTable
        metric={t("common.records", { count: assets.length })}
        emptyLabel={t("assets.tableTitle")}
        emptyMessage={t("assets.empty")}
        columns={[t("labels.assetId"), t("labels.deviceType"), t("labels.brand"), t("labels.model"), t("labels.department"), t("labels.status")]}
      >
        {assets.length === 0 ? (
          <EmptyRow colSpan="6" message={t("assets.empty")} />
        ) : (
          assets.map((asset) => (
            <tr key={asset._id}>
              <td className="font-black text-slate-950">{asset.assetId}</td>
              <td>{enumLabel("deviceType", asset.deviceType)}</td>
              <td>{asset.brand}</td>
              <td>{asset.model}</td>
              <td>{asset.department}</td>
              <td>
                <Badge tone={assetTone(asset.status)}>{enumLabel("assetStatus", asset.status)}</Badge>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </Layout>
  );
}

function assetTone(status) {
  if (status === "active") return "green";
  if (status === "under_repair") return "amber";
  if (status === "damaged") return "red";
  if (status === "retired") return "slate";
  return "blue";
}

export default Assets;
