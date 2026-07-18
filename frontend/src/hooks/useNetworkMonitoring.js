import { useCallback, useEffect, useState } from "react";
import networkService from "../services/networkService";

export default function useNetworkMonitoring(filters) {
  const [summary, setSummary] = useState(null); const [devices, setDevices] = useState([]); const [incidents, setIncidents] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null); const [history, setHistory] = useState([]); const [uptimePercent, setUptimePercent] = useState(0);
  const [loading, setLoading] = useState(true); const [detailLoading, setDetailLoading] = useState(false); const [error, setError] = useState(""); const [actionKey, setActionKey] = useState("");
  const load = useCallback(async () => { setLoading(true); try { const [s, d, i] = await Promise.all([networkService.summary(), networkService.devices(filters), networkService.incidents()]); setSummary(s.data); setDevices(d.data?.devices || d.data || []); setIncidents(i.data?.incidents || i.data || []); setError(""); } catch (e) { setError(e.response?.data?.message || "Unable to load network monitoring data"); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { let active = true; Promise.resolve().then(() => active && load()); const tick = () => { if (document.visibilityState === "visible") load(); }; const id = setInterval(tick, 15000); return () => { active = false; clearInterval(id); }; }, [load]);
  const select = useCallback(async (device, range = "24h") => { setSelectedDevice(device); if (!device?._id) return; setDetailLoading(true); try { const [d, h] = await Promise.all([networkService.detail(device._id), networkService.history(device._id, range)]); setSelectedDevice(d.data?.device || d.data); setHistory(h.data?.history || []); setUptimePercent(h.data?.uptimePercent ?? 0); } catch (e) { setError(e.response?.data?.message || "Unable to load device details"); } finally { setDetailLoading(false); } }, []);
  const action = useCallback(async (key, fn) => { setActionKey(key); try { await fn(); await load(); return true; } catch (e) { setError(e.response?.data?.message || "Network action failed"); return false; } finally { setActionKey(""); } }, [load]);
  return { summary, devices, incidents, selectedDevice, setSelectedDevice, history, uptimePercent, loading, detailLoading, error, setError, actionKey, load, select, action };
}
