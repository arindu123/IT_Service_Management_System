import API from "./apiClient";

const networkService = {
  summary: () => API.get("/network/summary"),
  devices: (filters = {}) => API.get("/network/devices", { params: { ...filters, page: filters.page || 1, limit: filters.limit || 50 } }),
  incidents: () => API.get("/network/incidents", { params: { status: "open", limit: 5 } }),
  detail: (id) => API.get(`/network/devices/${id}`),
  history: (id, range = "24h") => API.get(`/network/devices/${id}/history`, { params: { range, limit: 30 } }),
  create: (payload) => API.post("/network/devices", payload),
  update: (id, payload) => API.patch(`/network/devices/${id}`, payload),
  check: (id) => API.post(`/network/devices/${id}/check`),
  pause: (id) => API.post(`/network/devices/${id}/pause`),
  resume: (id) => API.post(`/network/devices/${id}/resume`),
  remove: (id) => API.delete(`/network/devices/${id}`),
};
export default networkService;
