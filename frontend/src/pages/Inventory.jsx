import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, PageHeader } from "../components/ui";
import { useTranslation } from "../i18n/LanguageContext";

function Inventory() {
  const navigate = useNavigate();
  const { enumLabel, t } = useTranslation();

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await API.get("/inventory", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setItems(response.data.items);
      } catch (err) {
        setError(err.response?.data?.message || t("inventory.loadError"));
      }
    };

    fetchInventory();
  }, []);

  return (
    <Layout>
      <PageHeader
        eyebrow={t("inventory.eyebrow")}
        title={t("inventory.title")}
        description={t("inventory.description")}
        action={<Button type="button" onClick={() => navigate("/inventory/add")}>{t("common.addItem")}</Button>}
      />

      <Alert message={error} />

      <DataTable
        metric={t("common.records", { count: items.length })}
        emptyLabel={t("inventory.tableTitle")}
        emptyMessage={t("inventory.empty")}
        columns={[t("labels.itemName"), t("labels.category"), t("labels.quantity"), t("labels.reorderLevel"), t("labels.unitPrice"), t("labels.stockStatus")]}
      >
        {items.length === 0 ? (
          <EmptyRow colSpan="6" message={t("inventory.empty")} />
        ) : (
          items.map((item) => {
            const isLowStock = item.quantity <= item.reorderLevel;

            return (
              <tr key={item._id} className={isLowStock ? "bg-red-50/50" : ""}>
                <td className="font-black text-slate-950">{item.itemName}</td>
                <td>
                  <Badge tone="slate">{enumLabel("inventoryCategory", item.category)}</Badge>
                </td>
                <td className="font-black text-slate-900">{item.quantity}</td>
                <td>{item.reorderLevel}</td>
                <td className="font-bold">Rs. {item.unitPrice?.toFixed(2) || "0.00"}</td>
                <td>
                  <Badge tone={isLowStock ? "red" : "green"}>
                    {isLowStock ? t("common.lowStock") : t("common.available")}
                  </Badge>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>
    </Layout>
  );
}

export default Inventory;
