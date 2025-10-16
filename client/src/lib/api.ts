// src/lib/api.ts
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  // Handle cases where the response might be empty (like a DELETE request)
  const text = await res.text();
  return text ? JSON.parse(text) : {};
};
