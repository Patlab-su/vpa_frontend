// src/services/api.js
import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
