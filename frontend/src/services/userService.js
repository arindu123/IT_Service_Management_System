import API from "./api";
const authConfig=()=>({headers:{Authorization:`Bearer ${localStorage.getItem("token")}`} });
export default { list:()=>API.get("/auth/users",authConfig()), resetRequests:()=>API.get("/auth/password-reset/requests",authConfig()), role:(userId,role)=>API.put("/auth/role",{userId,role},authConfig()), approveReset:(id)=>API.put(`/auth/password-reset/requests/${id}/approve`,{},authConfig()), cancelReset:(id)=>API.put(`/auth/password-reset/requests/${id}/cancel`,{},authConfig()) };
