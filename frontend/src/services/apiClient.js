import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("auth:session-invalid", { detail: { reason: "unauthorized" } }));
    }
    if (status === 403) {
      error.isForbidden = true;
      window.dispatchEvent(new CustomEvent("auth:forbidden", { detail: { url: error.config?.url } }));
    }
    if (error.code === "ECONNABORTED") error.isTimeout = true;
    return Promise.reject(error);
  }
);

export default apiClient;
