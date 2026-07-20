import { Button, DataTable } from "../../design-system";
import DeviceCard from "./DeviceCard";
import DeviceStatus from "./DeviceStatus";
import PingStatus from "./PingStatus";
import { useTranslation } from "../../i18n/LanguageContext";

const columnDefs = [
  { key: "name", headerKey: "networkPage.deviceName" },
  { key: "ip", headerKey: "networkPage.ipAddress" },
  { key: "type", headerKey: "networkPage.deviceType" },
  { key: "location", headerKey: "networkPage.location" },
  { key: "status", headerKey: "networkPage.status" },
  { key: "checked", headerKey: "networkPage.lastChecked" },
  { key: "response", headerKey: "networkPage.response" },
  { key: "actions", headerKey: "networkPage.actions" }
];

export default function DeviceTable({ devices, loading, formatDateTime, onView, onCheck, onEdit, onDelete, onPause, onResume, pagination }) {
  const { t } = useTranslation();

  const columns = columnDefs.map(col => ({
    ...col,
    header: t(col.headerKey)
  }));

  const cell = (device, column) => ({
    name: <strong>{device.name}</strong>,
    ip: device.ipAddress || device.hostname || "—",
    type: device.deviceType,
    location: [device.building, device.floor, device.room].filter(Boolean).join(" / ") || "—",
    status: <DeviceStatus status={device.status} />,
    checked: device.lastCheckedAt ? formatDateTime(device.lastCheckedAt) : "—",
    response: <PingStatus device={device} />,
    actions: (
      <div className="network-row-actions">
        <Button variant="ghost" onClick={() => onView(device)}>{t('networkPage.view')}</Button>
        {onCheck && <Button variant="secondary" onClick={() => onCheck(device)}>{t('networkPage.check')}</Button>}
        {device.monitoringEnabled === false
          ? onResume && <Button variant="ghost" onClick={() => onResume(device)}>{t('networkPage.resume')}</Button>
          : onPause && <Button variant="ghost" onClick={() => onPause(device)}>{t('networkPage.pausedStatus')}</Button>}
        {onEdit && <Button variant="ghost" onClick={() => onEdit(device)}>{t('networkPage.edit')}</Button>}
        {onDelete && <Button variant="ghost" onClick={() => onDelete(device)}>{t('networkPage.delete')}</Button>}
      </div>
    )
  }[column.key]);

  return (
    <>
      <div className="network-table-desktop">
        <DataTable
          columns={columns}
          data={devices}
          loading={loading}
          rowKey="_id"
          caption={t('networkPage.totalDevices')}
          emptyTitle={t('networkPage.noNetworkDevicesFound')}
          emptyDescription={t('networkPage.adjustFiltersOrAdd')}
          renderCell={cell}
          pagination={pagination}
        />
      </div>
      <div className="network-card-list">
        {!loading && devices.map(device => (
          <DeviceCard key={device._id} device={device} onView={onView} onCheck={onCheck} onPause={onPause} onResume={onResume} />
        ))}
      </div>
    </>
  );
}
