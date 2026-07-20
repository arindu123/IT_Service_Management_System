import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/LanguageContext";
import { Button, Card, CardHeader, CardBody, DataTable, StatusBadge } from "../../design-system";

export default function InventoryWarnings({ items, canView, enumLabel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const columns = [
    { key: "itemName", header: t('inventoryPage.itemName') },
    { key: "category", header: t('labels.category') },
    { key: "quantity", header: t('common.available') },
    { key: "reorderLevel", header: t('inventoryPage.minimumLevel') },
    { key: "status", header: t('labels.status') },
  ];
  return (
    <Card>
      <CardHeader title={t('dashboardPage.inventoryWarningsTitle')} description={t('dashboardPage.inventoryWarningsDesc')} action={<Button variant="secondary" disabled={!canView} onClick={() => navigate("/inventory")}>{t('dashboardPage.viewInventoryBtn')}</Button>} />
      <CardBody>
        <DataTable
          columns={columns}
          data={items}
          rowKey={(row) => row._id || row.itemName}
          caption={t('dashboardPage.lowAndCriticalStock')}
          emptyTitle={t('dashboardPage.noInventoryWarnings')}
          emptyDescription={t('dashboardPage.allItemsAboveMinimum')}
          renderCell={(row, column) => {
            if (column.key === "category") return enumLabel("inventoryCategory", row.category);
            if (column.key === "status") {
              const critical = Number(row.quantity) === 0;
              return <StatusBadge status="low_stock" tone={critical ? "danger" : "warning"} label={critical ? t('dashboardPage.criticalStock') : t('dashboardPage.lowStock')} />;
            }
            return row[column.key] ?? "—";
          }}
        />
      </CardBody>
    </Card>
  );
}
