import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { Alert, Badge, Button, DataTable, EmptyRow, FormActions, FormPanel, PageHeader, StatCard } from "../components/ui";
import { hasRole, NETWORK_MONITORING_MANAGE_ROLES } from "../utils/roles";
import { useTranslation } from "../i18n/LanguageContext";

const DEVICE_TYPES = [
  ["pc", "PC"],
  ["server", "Server"],
  ["printer", "Printer"],
  ["router", "Router"],
  ["switch", "Switch"],
  ["access_point", "Access Point"],
  ["cctv_nvr", "CCTV / NVR"],
  ["biometric", "Biometric"],
  ["other", "Other"],
];

const CHECK_METHODS = [
  ["icmp", "ICMP ping"],
  ["tcp", "TCP port"],
  ["http", "HTTP"],
  ["https", "HTTPS"],
];

const STATUS_TONES = {
  online: "green",
  warning: "amber",
  offline: "red",
  paused: "slate",
  unknown: "blue",
};

const EMPTY_FORM = {
  name: "",
  hostname: "",
  ipAddress: "",
  deviceType: "pc",
  department: "",
  building: "",
  floor: "",
  room: "",
  description: "",
  monitoringEnabled: true,
  checkMethod: "icmp",
  tcpPort: "",
  checkIntervalSeconds: "60",
  timeoutMs: "3000",
  failureThreshold: "3",
};

function NetworkMonitoring() {
  const { formatDateTime, message } = useTranslation();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "null"), []);
  const canManage = hasRole(user, NETWORK_MONITORING_MANAGE_ROLES);

  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    deviceType: "",
    department: "",
    building: "",
  });
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyRange, setHistoryRange] = useState("24h");
  const [uptimePercent, setUptimePercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }), []);

  const fetchNetworkData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => String(value || "").trim())
      );
      const headers = authHeaders();
      const [summaryResponse, devicesResponse, incidentsResponse] = await Promise.all([
        API.get("/network/summary", { headers }),
        API.get("/network/devices", { headers, params: { ...params, limit: 100 } }),
        API.get("/network/incidents", { headers, params: { status: "open", limit: 5 } }),
      ]);
      const nextDevices = devicesResponse.data.devices || [];

      setSummary(summaryResponse.data);
      setDevices(nextDevices);
      setSelectedDevice((current) => {
        if (!current?._id) return current;
        return nextDevices.find((device) => device._id === current._id) || current;
      });
      setIncidents(incidentsResponse.data.incidents || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load network monitoring data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authHeaders, filters]);

  const loadDeviceDetail = useCallback(async (deviceId, range = historyRange) => {
    setDetailLoading(true);
    setError("");

    try {
      const headers = authHeaders();
      const [deviceResponse, historyResponse] = await Promise.all([
        API.get(`/network/devices/${deviceId}`, { headers }),
        API.get(`/network/devices/${deviceId}/history`, {
          headers,
          params: { range, limit: 30 },
        }),
      ]);

      setSelectedDevice(deviceResponse.data.device);
      setSelectedIncident(deviceResponse.data.openIncident || null);
      setHistory(historyResponse.data.history || []);
      setUptimePercent(historyResponse.data.uptimePercent || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load device details");
    } finally {
      setDetailLoading(false);
    }
  }, [authHeaders, historyRange]);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      fetchNetworkData();
    }, 0);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNetworkData({ silent: true });
      }
    }, 15000);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [fetchNetworkData]);

  useEffect(() => {
    if (!selectedDevice?._id) return undefined;

    const detailLoadId = window.setTimeout(() => {
      loadDeviceDetail(selectedDevice._id, historyRange);
    }, 0);

    return () => window.clearTimeout(detailLoadId);
  }, [historyRange, loadDeviceDetail, selectedDevice?._id]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFormChange = (event) => {
    const { name, type, checked, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateForm = () => {
    setEditingDevice(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
    setSuccess("");
    setError("");
  };

  const openEditForm = (device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name || "",
      hostname: device.hostname || "",
      ipAddress: device.ipAddress || "",
      deviceType: device.deviceType || "pc",
      department: device.department || "",
      building: device.building || "",
      floor: device.floor || "",
      room: device.room || "",
      description: device.description || "",
      monitoringEnabled: Boolean(device.monitoringEnabled),
      checkMethod: device.checkMethod || "icmp",
      tcpPort: device.tcpPort || "",
      checkIntervalSeconds: String(device.checkIntervalSeconds || 60),
      timeoutMs: String(device.timeoutMs || 3000),
      failureThreshold: String(device.failureThreshold || 3),
    });
    setShowForm(true);
    setSuccess("");
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDevice(null);
    setFormData(EMPTY_FORM);
  };

  const buildPayload = () => ({
    ...formData,
    tcpPort: formData.tcpPort === "" ? null : Number(formData.tcpPort),
    checkIntervalSeconds: Number(formData.checkIntervalSeconds),
    timeoutMs: Number(formData.timeoutMs),
    failureThreshold: Number(formData.failureThreshold),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const headers = authHeaders();
      const payload = buildPayload();

      if (editingDevice) {
        await API.patch(`/network/devices/${editingDevice._id}`, payload, { headers });
        setSuccess("Network device updated successfully");
      } else {
        await API.post("/network/devices", payload, { headers });
        setSuccess("Network device created successfully");
      }

      closeForm();
      await fetchNetworkData({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save network device");
    } finally {
      setSubmitting(false);
    }
  };

  const runDeviceAction = async (device, action) => {
    const key = `${device._id}-${action}`;
    setActionKey(key);
    setError("");
    setSuccess("");

    try {
      const headers = authHeaders();

      if (action === "check") {
        await API.post(`/network/devices/${device._id}/check`, {}, { headers });
        setSuccess(`Manual check completed for ${device.name}`);
      }

      if (action === "pause") {
        await API.post(`/network/devices/${device._id}/pause`, {}, { headers });
        setSuccess(`Monitoring paused for ${device.name}`);
      }

      if (action === "resume") {
        await API.post(`/network/devices/${device._id}/resume`, {}, { headers });
        setSuccess(`Monitoring resumed for ${device.name}`);
      }

      await fetchNetworkData({ silent: true });

      if (selectedDevice?._id === device._id) {
        await loadDeviceDetail(device._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Network action failed");
    } finally {
      setActionKey("");
    }
  };

  const deleteDevice = async (device) => {
    if (!window.confirm(`Delete ${device.name} and its monitoring history?`)) return;

    setActionKey(`${device._id}-delete`);
    setError("");
    setSuccess("");

    try {
      await API.delete(`/network/devices/${device._id}`, {
        headers: authHeaders(),
      });

      if (selectedDevice?._id === device._id) {
        setSelectedDevice(null);
        setSelectedIncident(null);
        setHistory([]);
      }

      setSuccess(`${device.name} deleted`);
      await fetchNetworkData({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete network device");
    } finally {
      setActionKey("");
    }
  };

  const statusCounts = summary?.byStatus || {};
  const lastCycle = summary?.scheduler?.lastCycleAt ? formatDateTime(summary.scheduler.lastCycleAt) : "Not run yet";

  return (
    <Layout>
      <PageHeader
        eyebrow={message("Network operations")}
        title={message("Network Monitoring")}
        description={message("Register LAN devices, monitor availability from the backend, and track location-based incidents.")}
        action={canManage ? <Button type="button" onClick={openCreateForm}>{message("Add Device")}</Button> : null}
      />

      <Alert message={error} />
      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label={message("Total")} value={summary?.total ?? 0} tone="blue" meta={message("Registered devices")} />
        <StatCard label={message("Online")} value={statusCounts.online || 0} tone="green" meta={message("Responding now")} />
        <StatCard label={message("Warning")} value={statusCounts.warning || 0} tone="amber" meta={message("Below threshold")} />
        <StatCard label={message("Offline")} value={statusCounts.offline || 0} tone="red" meta={message("Incident threshold")} />
        <StatCard label={message("Paused")} value={statusCounts.paused || 0} tone="blue" meta={message("Skipped by scheduler")} />
        <StatCard label={message("Incidents")} value={summary?.openIncidentCount ?? 0} tone="red" meta={message("Open alerts")} />
      </section>

      <section className="filter-panel">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <input
            type="search"
            value={filters.search}
            onChange={(event) => handleFilterChange("search", event.target.value)}
            placeholder={message("Search name, IP, hostname, department or room...")}
          />
          <select value={filters.status} onChange={(event) => handleFilterChange("status", event.target.value)}>
            <option value="">{message("All statuses")}</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
            <option value="paused">Paused</option>
            <option value="unknown">Unknown</option>
          </select>
          <select value={filters.deviceType} onChange={(event) => handleFilterChange("deviceType", event.target.value)}>
            <option value="">{message("All device types")}</option>
            {DEVICE_TYPES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            value={filters.department}
            onChange={(event) => handleFilterChange("department", event.target.value)}
            placeholder="Department"
          />
          <input
            value={filters.building}
            onChange={(event) => handleFilterChange("building", event.target.value)}
            placeholder="Building"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.12em] text-[#62709a]">
          <span>Last cycle: {lastCycle}</span>
          <span>Polling: 15s</span>
          <span>Concurrency: {summary?.config?.maxConcurrency ?? "--"}</span>
          {summary?.config?.simulationMode && <Badge tone="amber">Simulation mode</Badge>}
        </div>
      </section>

      {showForm && canManage && (
        <FormPanel>
          <form onSubmit={handleSubmit} className="form-grid">
            <Field label="Device name">
              <input name="name" value={formData.name} onChange={handleFormChange} placeholder="Accounts-PC-01" required />
            </Field>
            <Field label="IP address">
              <input name="ipAddress" value={formData.ipAddress} onChange={handleFormChange} placeholder="192.168.1.25" required />
            </Field>
            <Field label="Hostname">
              <input name="hostname" value={formData.hostname} onChange={handleFormChange} placeholder="ACCOUNTS-PC-01" />
            </Field>
            <Field label="Device type">
              <select name="deviceType" value={formData.deviceType} onChange={handleFormChange}>
                {DEVICE_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Department">
              <input name="department" value={formData.department} onChange={handleFormChange} placeholder="Accounts" />
            </Field>
            <Field label="Building">
              <input name="building" value={formData.building} onChange={handleFormChange} placeholder="Main Building" />
            </Field>
            <Field label="Floor">
              <input name="floor" value={formData.floor} onChange={handleFormChange} placeholder="First Floor" />
            </Field>
            <Field label="Room">
              <input name="room" value={formData.room} onChange={handleFormChange} placeholder="Accounts Office" />
            </Field>
            <Field label="Check method">
              <select name="checkMethod" value={formData.checkMethod} onChange={handleFormChange}>
                {CHECK_METHODS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="TCP / HTTP port">
              <input
                type="number"
                min="1"
                max="65535"
                name="tcpPort"
                value={formData.tcpPort}
                onChange={handleFormChange}
                placeholder={formData.checkMethod === "tcp" ? "Required for TCP" : "Optional"}
                disabled={formData.checkMethod === "icmp"}
                required={formData.checkMethod === "tcp"}
              />
            </Field>
            <Field label="Interval seconds">
              <input type="number" min="30" max="86400" name="checkIntervalSeconds" value={formData.checkIntervalSeconds} onChange={handleFormChange} required />
            </Field>
            <Field label="Timeout ms">
              <input type="number" min="1000" max="10000" name="timeoutMs" value={formData.timeoutMs} onChange={handleFormChange} required />
            </Field>
            <Field label="Failure threshold">
              <input type="number" min="1" max="10" name="failureThreshold" value={formData.failureThreshold} onChange={handleFormChange} required />
            </Field>
            <Field label="Monitoring">
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[#dce3f1] bg-white px-4 text-sm font-bold normal-case tracking-normal text-slate-700">
                <input
                  type="checkbox"
                  name="monitoringEnabled"
                  checked={formData.monitoringEnabled}
                  onChange={handleFormChange}
                  className="h-4 w-4"
                />
                Enabled
              </label>
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Notes, service owner, or simulation scenario in development"
              />
            </Field>
            <FormActions>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving" : editingDevice ? "Save Device" : "Create Device"}</Button>
              <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
            </FormActions>
          </form>
        </FormPanel>
      )}

      <DataTable
        columns={["Device", "Location", "Status", "Response", "Last Seen", "Method", "Actions"]}
        emptyLabel={loading ? "Loading monitored devices..." : "Monitored devices"}
        metric={`${devices.length} visible`}
      >
        {devices.length === 0 ? (
          <EmptyRow colSpan={7} message={loading ? "Loading devices..." : "No monitored devices match these filters."} />
        ) : (
          devices.map((device) => (
            <tr key={device._id} className={selectedDevice?._id === device._id ? "selected-request-row" : ""}>
              <td>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => loadDeviceDetail(device._id)}
                    className="block max-w-[220px] truncate text-left text-sm font-black text-[#1d2a55] hover:text-[#344a86]"
                  >
                    {device.name}
                  </button>
                  <span className="block truncate text-xs font-bold text-[#8793b5]">{device.ipAddress} {device.hostname ? `- ${device.hostname}` : ""}</span>
                </div>
              </td>
              <td>
                <span className="block max-w-[220px] truncate font-bold text-[#485579]">{formatLocation(device)}</span>
                <span className="block truncate text-xs font-bold text-[#8793b5]">{formatDeviceType(device.deviceType)}</span>
              </td>
              <td>
                <Badge tone={STATUS_TONES[device.status] || "slate"}>{formatStatus(device.status)}</Badge>
                {device.consecutiveFailures > 0 && (
                  <span className="ml-2 text-xs font-black text-amber-700">{device.consecutiveFailures}/{device.failureThreshold}</span>
                )}
              </td>
              <td>{device.responseTimeMs !== null && device.responseTimeMs !== undefined ? `${Math.round(device.responseTimeMs)} ms` : "--"}</td>
              <td>{device.lastSeenAt ? formatDateTime(device.lastSeenAt) : "--"}</td>
              <td>
                <span className="font-black uppercase text-[#344a86]">{device.checkMethod}</span>
                {device.tcpPort && <span className="block text-xs font-bold text-[#8793b5]">Port {device.tcpPort}</span>}
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="repair-action-button" onClick={() => loadDeviceDetail(device._id)}>View</button>
                  {canManage && (
                    <>
                      <button type="button" className="repair-action-button" onClick={() => openEditForm(device)}>Edit</button>
                      {device.monitoringEnabled && (
                        <button
                          type="button"
                          className="repair-action-button"
                          disabled={actionKey === `${device._id}-check`}
                          onClick={() => runDeviceAction(device, "check")}
                        >
                          Check
                        </button>
                      )}
                      <button
                        type="button"
                        className="repair-action-button"
                        disabled={actionKey === `${device._id}-${device.monitoringEnabled ? "pause" : "resume"}`}
                        onClick={() => runDeviceAction(device, device.monitoringEnabled ? "pause" : "resume")}
                      >
                        {device.monitoringEnabled ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        className="repair-action-button repair-action-danger"
                        disabled={actionKey === `${device._id}-delete`}
                        onClick={() => deleteDevice(device)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.75fr]">
        <DeviceDetail
          device={selectedDevice}
          incident={selectedIncident}
          history={history}
          range={historyRange}
          uptimePercent={uptimePercent}
          loading={detailLoading}
          onRangeChange={setHistoryRange}
          formatDateTime={formatDateTime}
        />
        <IncidentList incidents={incidents} formatDateTime={formatDateTime} />
      </section>
    </Layout>
  );
}

function DeviceDetail({ device, incident, history, range, uptimePercent, loading, onRangeChange, formatDateTime }) {
  if (!device) {
    return (
      <section className="dashboard-modern-panel">
        <p className="page-eyebrow">Device detail</p>
        <h3 className="text-lg font-black text-[#1d2a55]">Select a monitored device</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#62709a]">Status history, uptime and active incident context will appear here.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-modern-panel">
      <div className="dashboard-panel-header">
        <div>
          <p className="page-eyebrow">Device detail</p>
          <h3>{device.name}</h3>
        </div>
        <Badge tone={STATUS_TONES[device.status] || "slate"}>{formatStatus(device.status)}</Badge>
      </div>

      {incident && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {incident.message} - {formatLocation(incident.locationSnapshot)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="IP address" value={device.ipAddress} />
        <DetailItem label="Hostname" value={device.hostname || "--"} />
        <DetailItem label="Type" value={formatDeviceType(device.deviceType)} />
        <DetailItem label="Location" value={formatLocation(device)} />
        <DetailItem label="Response time" value={device.responseTimeMs !== null && device.responseTimeMs !== undefined ? `${Math.round(device.responseTimeMs)} ms` : "--"} />
        <DetailItem label="Uptime" value={`${uptimePercent}% (${range})`} />
        <DetailItem label="Last checked" value={device.lastCheckedAt ? formatDateTime(device.lastCheckedAt) : "--"} />
        <DetailItem label="Last seen" value={device.lastSeenAt ? formatDateTime(device.lastSeenAt) : "--"} />
        <DetailItem label="Status changed" value={device.lastStatusChangedAt ? formatDateTime(device.lastStatusChangedAt) : "--"} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["24h", "7d", "30d"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onRangeChange(item)}
            className={`repair-action-button ${range === item ? "repair-action-view" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-[#edf1f8]">
        <table className="preview-table">
          <thead>
            <tr>
              <th>Checked</th>
              <th>Result</th>
              <th>Method</th>
              <th>Response</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading history...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5}>No checks recorded for this range.</td></tr>
            ) : (
              history.map((item) => (
                <tr key={item._id}>
                  <td>{formatDateTime(item.checkedAt)}</td>
                  <td><Badge tone={item.status === "online" ? "green" : "red"}>{item.status}</Badge></td>
                  <td>{item.method}</td>
                  <td>{item.responseTimeMs !== null && item.responseTimeMs !== undefined ? `${Math.round(item.responseTimeMs)} ms` : "--"}</td>
                  <td>{item.errorMessage || "--"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function IncidentList({ incidents, formatDateTime }) {
  return (
    <section className="dashboard-modern-panel">
      <div className="dashboard-panel-header">
        <div>
          <p className="page-eyebrow">Open incidents</p>
          <h3>Location alerts</h3>
        </div>
        <span>{incidents.length} open</span>
      </div>

      {incidents.length === 0 ? (
        <div className="dashboard-empty-state">
          <strong>No open network incidents</strong>
          <span>Offline alerts will appear here after the failure threshold is reached.</span>
        </div>
      ) : (
        <div className="focus-list">
          {incidents.map((incident) => (
            <div key={incident._id} className="focus-row focus-red">
              <span className="focus-value">!</span>
              <span className="focus-copy">
                <strong>{incident.deviceId?.name || incident.message}</strong>
                <small>{formatLocation(incident.locationSnapshot)} - {formatDateTime(incident.openedAt)}</small>
              </span>
              <span className="focus-arrow">{incident.failureCount}x</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`field ${className}`.trim()}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-[#edf1f8] bg-[#f7f9ff] px-4 py-3">
      <span className="block truncate text-[10px] font-black uppercase tracking-[0.14em] text-[#8793b5]">{label}</span>
      <strong className="mt-1 block break-words text-sm font-black text-[#1d2a55]">{value || "--"}</strong>
    </div>
  );
}

function formatStatus(status = "unknown") {
  return String(status).replace(/_/g, " ");
}

function formatDeviceType(deviceType = "") {
  const match = DEVICE_TYPES.find(([value]) => value === deviceType);
  return match ? match[1] : formatStatus(deviceType);
}

function formatLocation(source = {}) {
  return [source.department, source.building, source.floor, source.room].filter(Boolean).join(" / ") || "--";
}

export default NetworkMonitoring;
