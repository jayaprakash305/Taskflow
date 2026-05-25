import axios from "axios";
import API_URL from "../config/api";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;