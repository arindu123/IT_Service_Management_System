import API from "./api";
const config=()=>({headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});
export const repairService={list:async()=>(await API.get("/repairs",config())).data.repairs||[],get:async(id)=>(await API.get(`/repairs/${id}`,config())).data,create:async(payload)=>(await API.post("/repairs",payload,config())).data.repair,update:async(id,payload)=>(await API.put(`/repairs/${id}`,payload,config())).data.repair,remove:async(id)=>API.delete(`/repairs/${id}`,config()),nextNumber:async()=>(await API.get("/repairs/next-rr",config())).data.rrNumber};
export default repairService;
