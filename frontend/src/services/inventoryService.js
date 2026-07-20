import API from "./apiClient";
export const inventoryService={list:async()=>(await API.get("/inventory")).data.items||[],get:async(id)=>(await API.get(`/inventory/${id}`)).data,create:async(payload)=>(await API.post("/inventory",payload)).data.item,update:async(id,payload)=>(await API.put(`/inventory/${id}`,payload)).data.item,remove:async(id)=>API.delete(`/inventory/${id}`),lowStock:async()=>(await API.get("/inventory/low-stock")).data.items||[]};
export default inventoryService;
