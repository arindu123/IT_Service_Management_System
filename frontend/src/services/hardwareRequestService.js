import API from "./apiClient";

export const hardwareRequestService = {
  async list() { return (await API.get("/tickets")).data.tickets || []; },
  async listMine() { return (await API.get("/tickets/mine")).data.tickets || []; },
  async get(id) { return (await API.get(`/tickets/${id}`)).data; },
  async create(payload) { return (await API.post("/tickets", payload)).data.ticket; },
  async update(id, payload) { return (await API.put(`/tickets/${id}/update`, payload)).data.ticket; },
  async updateStatus(id, payload) { return (await API.put(`/tickets/${id}/status`, payload)).data.ticket; },
  async acknowledge(id, comment) { return (await API.put(`/tickets/${id}/acknowledge`, { comment })).data.ticket; },
  async reject(id, comment) { return (await API.put(`/tickets/${id}/reject`, { comment })).data.ticket; },
  async assign(id, technicianId) { return (await API.put(`/tickets/${id}/assign`, { technicianId })).data.ticket; },
  async listTechnicians() { const users=(await API.get("/auth/users")).data.users||[]; return users.filter((user)=>user.role==="technician"); },
  async remove(id) { return API.delete(`/tickets/${id}`); },
  async upload(id, files) {
    const body = new FormData();
    files.forEach((file) => body.append("attachments", file));
    return (await API.post(`/tickets/${id}/attachments`, body)).data.ticket;
  },
  async download(id, attachmentId) {
    return API.get(`/tickets/${id}/attachments/${attachmentId}/download`, { responseType: "blob" });
  },
  async removeEvidence(id, attachmentId) {
    return (await API.delete(`/tickets/${id}/attachments/${attachmentId}`)).data.ticket;
  },
};

export default hardwareRequestService;
