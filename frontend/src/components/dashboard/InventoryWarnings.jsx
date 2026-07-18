import { useNavigate } from "react-router-dom";
import { Button, Card, CardHeader, CardBody, DataTable, StatusBadge } from "../../design-system";

const columns = [
  { key: "itemName", header: "Item" },
  { key: "category", header: "Category" },
  { key: "quantity", header: "Available" },
  { key: "reorderLevel", header: "Minimum Level" },
  { key: "status", header: "Status" },
];

export default function InventoryWarnings({ items, canView, enumLabel }) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader title="Inventory warnings" description="Items at or below their configured minimum level." action={<Button variant="secondary" disabled={!canView} onClick={() => navigate("/inventory")}>View inventory</Button>} />
      <CardBody>
        <DataTable
          columns={columns}
          data={items}
          rowKey={(row) => row._id || row.itemName}
          caption="Low and critical stock items"
          emptyTitle="No inventory warnings"
          emptyDescription="All reported items are above their minimum level."
          renderCell={(row, column) => {
            if (column.key === "category") return enumLabel("inventoryCategory", row.category);
            if (column.key === "status") {
              const critical = Number(row.quantity) === 0;
              return <StatusBadge status="low_stock" tone={critical ? "danger" : "warning"} label={critical ? "Critical stock" : "Low stock"} />;
            }
            return row[column.key] ?? "—";
          }}
        />
      </CardBody>
    </Card>
  );
}
