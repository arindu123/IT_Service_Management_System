import API from "./apiClient";
export const repairService={list:async()=>(await API.get("/repairs")).data.repairs||[],get:async(id)=>(await API.get(`/repairs/${id}`)).data,create:async(payload)=>(await API.post("/repairs",payload)).data.repair,update:async(id,payload)=>(await API.put(`/repairs/${id}`,payload)).data.repair,remove:async(id)=>API.delete(`/repairs/${id}`),nextNumber:async()=>(await API.get("/repairs/next-rr")).data.rrNumber};
export default repairService;
