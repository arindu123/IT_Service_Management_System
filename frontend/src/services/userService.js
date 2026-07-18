import API from "./apiClient";
export default { list:()=>API.get("/auth/users"), resetRequests:()=>API.get("/auth/password-reset/requests"), role:(userId,role)=>API.put("/auth/role",{userId,role}), approveReset:(id)=>API.put(`/auth/password-reset/requests/${id}/approve`,{}), cancelReset:(id)=>API.put(`/auth/password-reset/requests/${id}/cancel`,{}) };
