// employee/src/lib/api.ts
import { API_BASE_URL } from "./config";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("employee_token"); // Use employee_token
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};