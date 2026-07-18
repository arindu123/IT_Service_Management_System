import { useCallback, useEffect, useMemo, useState } from "react";
import hardwareRequestService from "../services/hardwareRequestService";

export default function useHardwareRequests(errorMessage = "Failed to load hardware requests") {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => hardwareRequestService.list(), []);
  useEffect(() => {
    let active = true;
    load().then((items) => { if (active) { setRequests(items); setError(""); } })
      .catch((err) => { if (active) setError(err.response?.data?.message || errorMessage); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [errorMessage, load]);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const term = filters.search.trim().toLowerCase();
    const searchable = [request.ticketId, request.requesterProfile?.name, request.requesterProfile?.employeeId,
      request.requestType, request.hardwareCategory, request.issueDescription, request.department].filter(Boolean).join(" ").toLowerCase();
    const requestDate = request.createdAt ? new Date(request.createdAt).toISOString().slice(0, 10) : "";
    return (!term || searchable.includes(term)) && (!filters.status || request.status === filters.status) &&
      (!filters.priority || request.priority === filters.priority) && (!filters.date || requestDate === filters.date);
  }), [filters, requests]);

  const replaceRequest = useCallback((updated) => setRequests((items) => items.map((item) => item._id === updated._id ? updated : item)), []);
  const removeRequest = useCallback((id) => setRequests((items) => items.filter((item) => item._id !== id)), []);
  return { requests, filteredRequests, filters, setFilters, loading, error, setError, replaceRequest, removeRequest };
}
