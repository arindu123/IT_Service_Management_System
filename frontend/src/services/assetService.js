import API from "./apiClient";
export const assetService={
  async list(){return (await API.get("/assets")).data.assets||[];},
  async get(id){return (await API.get(`/assets/${id}`)).data;},
  async create(payload){return (await API.post("/assets",payload)).data;},
  async update(id,payload){return (await API.put(`/assets/${id}`,payload)).data;},
  async destroy(id,reason){return (await API.put(`/assets/${id}/destroy`,{reason})).data;},
  async listCustody(){return (await API.get("/asset-issues")).data.issues||[];},
  async listUsers(){return (await API.get("/auth/users")).data.users||[];},
  async issue(payload){return (await API.post("/asset-issues",payload)).data;},
  async returnCustody(id){return (await API.put(`/asset-issues/${id}/return`,{})).data;},
  async transfer(id,payload){return (await API.put(`/asset-issues/${id}/transfer`,payload)).data;},
  async destroyCustody(id,reason){return (await API.put(`/asset-issues/${id}/destroy`,{reason})).data;},
};
export default assetService;
