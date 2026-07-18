import API from "./api";
const config=()=>({headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});
export const inventoryService={list:async()=>(await API.get("/inventory",config())).data.items||[],get:async(id)=>(await API.get(`/inventory/${id}`,config())).data,create:async(payload)=>(await API.post("/inventory",payload,config())).data.item,update:async(id,payload)=>(await API.put(`/inventory/${id}`,payload,config())).data.item,remove:async(id)=>API.delete(`/inventory/${id}`,config()),lowStock:async()=>(await API.get("/inventory/low-stock",config())).data.items||[]};
export default inventoryService;
