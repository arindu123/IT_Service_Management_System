import API from "./api";

const authConfig = (extra = {}) => ({
  ...extra,
  headers: { ...extra.headers, Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const hardwareRequestService = {
  async list() { return (await API.get("/tickets", authConfig())).data.tickets || []; },
  async get(id) { return (await API.get(`/tickets/${id}`, authConfig())).data; },
  async create(payload) { return (await API.post("/tickets", payload, authConfig())).data.ticket; },
  async update(id, payload) { return (await API.put(`/tickets/${id}/update`, payload, authConfig())).data.ticket; },
  async updateStatus(id, payload) { return (await API.put(`/tickets/${id}/status`, payload, authConfig())).data.ticket; },
  async acknowledge(id, comment) { return (await API.put(`/tickets/${id}/acknowledge`, { comment }, authConfig())).data.ticket; },
  async reject(id, comment) { return (await API.put(`/tickets/${id}/reject`, { comment }, authConfig())).data.ticket; },
  async assign(id, technicianId) { return (await API.put(`/tickets/${id}/assign`, { technicianId }, authConfig())).data.ticket; },
  async listTechnicians() { const users=(await API.get("/auth/users",authConfig())).data.users||[]; return users.filter((user)=>user.role==="technician"); },
  async remove(id) { return API.delete(`/tickets/${id}`, authConfig()); },
  async upload(id, files) {
    const body = new FormData();
    files.forEach((file) => body.append("attachments", file));
    return (await API.post(`/tickets/${id}/attachments`, body, authConfig())).data.ticket;
  },
  async download(id, attachmentId) {
    return API.get(`/tickets/${id}/attachments/${attachmentId}/download`, authConfig({ responseType: "blob" }));
  },
  async removeEvidence(id, attachmentId) {
    return (await API.delete(`/tickets/${id}/attachments/${attachmentId}`, authConfig())).data.ticket;
  },
};

export default hardwareRequestService;
