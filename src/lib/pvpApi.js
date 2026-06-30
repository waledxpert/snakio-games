const API_BASE = (
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function createMatch(payload) {
  return request("/api/matches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMatch(code) {
  return request(`/api/matches/${code}`);
}

export function joinMatch(code, payload) {
  return request(`/api/matches/${code}/join`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createMatchShare(code, payload) {
  return request(`/api/matches/${code}/share`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchSharedResult(shareId) {
  return request(`/api/shares/${shareId}`);
}

export function getBackendBaseUrl() {
  return API_BASE;
}
