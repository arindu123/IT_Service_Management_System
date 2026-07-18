import API from "./api";
const config=()=>({headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});
export const assetService={
  async list(){return (await API.get("/assets",config())).data.assets||[];},
  async get(id){return (await API.get(`/assets/${id}`,config())).data;},
  async create(payload){return (await API.post("/assets",payload,config())).data;},
  async update(id,payload){return (await API.put(`/assets/${id}`,payload,config())).data;},
  async destroy(id,reason){return (await API.put(`/assets/${id}/destroy`,{reason},config())).data;},
  async listCustody(){return (await API.get("/asset-issues",config())).data.issues||[];},
  async listUsers(){return (await API.get("/auth/users",config())).data.users||[];},
  async issue(payload){return (await API.post("/asset-issues",payload,config())).data;},
  async returnCustody(id){return (await API.put(`/asset-issues/${id}/return`,{},config())).data;},
  async transfer(id,payload){return (await API.put(`/asset-issues/${id}/transfer`,payload,config())).data;},
  async destroyCustody(id,reason){return (await API.put(`/asset-issues/${id}/destroy`,{reason},config())).data;},
};
export default assetService;
