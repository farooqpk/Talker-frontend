import axios from "axios";
import Cookies from "js-cookie";

const _axios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

_axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accesstoken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

_axios.interceptors.response.use(
  async (response) => {
    if (response.data?.accesstoken) {
      Cookies.set("accesstoken", response.data.accesstoken, {
        expires: new Date(Date.now() + 60 * 60 * 1000),
      });
    }
    if (response.data?.refreshtoken) {
      Cookies.set("refreshtoken", response.data.refreshtoken, {
        expires: 7,
      });
    }
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      const refreshToken = Cookies.get("refreshtoken");

      if (refreshToken) {
        try {
          if (!isRefreshing) {
            isRefreshing = true;
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (refreshResponse.data?.accesstoken) {
              Cookies.set("accesstoken", refreshResponse.data.accesstoken, {
                expires: new Date(Date.now() + 60 * 60 * 1000),
              });

              // Retry the original requests in the queue
              refreshQueue.forEach((retry) =>
                retry(refreshResponse.data.accesstoken)
              );
              refreshQueue = [];
            }
          }

          // If the token refresh was successful, retry the original request
          const originalConfig = error.config;
          originalConfig.headers["Authorization"] = `Bearer ${Cookies.get(
            "accesstoken"
          )}`;
          return _axios.request(originalConfig);
        } catch (refreshError) {
          // Handle the refresh error, e.g., redirect to login page or show an error message
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    } else if (
      error.message === "Network Error" &&
      error.config &&
      error.config.retry
    ) {
      // Retry the original request in case of a network error
      return _axios.request(error.config);
    }

    return Promise.reject(error);
  }
);

export default _axios;
