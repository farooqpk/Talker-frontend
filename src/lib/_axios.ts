import { createAccessTokenFromRefreshToken } from "@/services/api/auth";
import axios from "axios";

const _axios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

_axios.defaults.withCredentials = true;

_axios.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

_axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await createAccessTokenFromRefreshToken();
        return _axios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default _axios;
