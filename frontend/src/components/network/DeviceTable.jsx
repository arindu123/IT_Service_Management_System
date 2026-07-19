import { Button, DataTable } from "../../design-system";
import DeviceCard from "./DeviceCard";
import DeviceStatus from "./DeviceStatus";
import PingStatus from "./PingStatus";

const columns = [{ key: "name", header: "Device name" }, { key: "ip", header: "IP address" }, { key: "type", header: "Device type" }, { key: "location", header: "Location" }, { key: "status", header: "Status" }, { key: "checked", header: "Last checked" }, { key: "response", header: "Response time" }, { key: "actions", header: "Actions" }];

export default function DeviceTable({ devices, loading, formatDateTime, onView, onCheck, onEdit, onDelete, onPause, onResume, pagination }) {
  const cell = (device, column) => ({
    name: <strong>{device.name}</strong>, ip: device.ipAddress || device.hostname || "—", type: device.deviceType,
    location: [device.building, device.floor, device.room].filter(Boolean).join(" / ") || "—", status: <DeviceStatus status={device.status}/>,
    checked: device.lastCheckedAt ? formatDateTime(device.lastCheckedAt) : "—", response: <PingStatus device={device}/>,
    actions: <div className="network-row-actions"><Button variant="ghost" onClick={() => onView(device)}>View</Button>{onCheck && <Button variant="secondary" onClick={() => onCheck(device)}>Check</Button>}{device.monitoringEnabled === false ? onResume && <Button variant="ghost" onClick={() => onResume(device)}>Resume</Button> : onPause && <Button variant="ghost" onClick={() => onPause(device)}>Pause</Button>}{onEdit && <Button variant="ghost" onClick={() => onEdit(device)}>Edit</Button>}{onDelete && <Button variant="ghost" onClick={() => onDelete(device)}>Delete</Button>}</div>,
  }[column.key]);
  return <><div className="network-table-desktop"><DataTable columns={columns} data={devices} loading={loading} rowKey="_id" caption="Network devices" emptyTitle="No network devices found" emptyDescription="Adjust filters or add a monitored device." renderCell={cell} pagination={pagination}/></div><div className="network-card-list">{!loading && devices.map(device => <DeviceCard key={device._id} device={device} onView={onView} onCheck={onCheck} onPause={onPause} onResume={onResume}/>)}</div></>;
}
