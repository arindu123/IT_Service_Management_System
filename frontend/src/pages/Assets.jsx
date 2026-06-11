import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";

function Assets() {
  const navigate = useNavigate();

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
        setError(err.response?.data?.message || "Failed to load assets");
      }
    };

    fetchAssets();
  }, []);

  return (
    <Layout>
      <PageHeader
        eyebrow="Asset register"
        title="Assets Management"
        description="Track devices, ownership context and lifecycle status across departments."
        action={<Button onClick={() => navigate("/assets/add")}>Add New Asset</Button>}
      />

      <Alert message={error} />

      <DataTable
        metric={`${assets.length} records`}
        emptyLabel="IT Assets"
        emptyMessage="No assets found"
        columns={["Asset ID", "Device Type", "Brand", "Model", "Department", "Status"]}
      >
        {assets.length === 0 ? (
          <EmptyRow colSpan="6" message="No assets found" />
        ) : (
          assets.map((asset) => (
            <tr key={asset._id}>
              <td className="font-black text-slate-950">{asset.assetId}</td>
              <td>{formatLabel(asset.deviceType)}</td>
              <td>{asset.brand}</td>
              <td>{asset.model}</td>
              <td>{asset.department}</td>
              <td>
                <Badge tone={assetTone(asset.status)}>{formatLabel(asset.status)}</Badge>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </Layout>
  );
}

function formatLabel(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function assetTone(status) {
  if (status === "active") return "green";
  if (status === "under_repair") return "amber";
  if (status === "damaged") return "red";
  if (status === "retired") return "slate";
  return "blue";
}

export default Assets;
