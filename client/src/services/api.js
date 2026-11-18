import axios from "axios";

// ─── Base URL Resolution ───────────────────────────────────────────────────────
// Gracefully resolves API base URL:
// 1. Uses VITE_API_URL if configured.
// 2. Normalizes trailing slashes and ensures single '/api' suffix.
// 3. Falls back gracefully in PROD to production Render backend and in DEV to localhost:5000.
// This prevents `/undefined/api/...` routing errors if environment variables are not set.
const resolveBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const rawUrl =
    typeof envUrl === "string" && envUrl.trim() !== ""
      ? envUrl.trim()
      : import.meta.env.PROD
      ? "https://teamforge-uy0n.onrender.com"
      : "http://localhost:5000";

  const cleaned = rawUrl.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;
