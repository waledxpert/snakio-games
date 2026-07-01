import { getBackendBaseUrl } from "./pvpApi";

const API_BASE = getBackendBaseUrl();

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

// ── Profiles ────────────────────────────────────────────────────────────────

export function upsertPlayer({ walletAddress, name }) {
  return request("/api/players", {
    method: "POST",
    body: JSON.stringify({ walletAddress, name }),
  });
}

export function getPlayer(address) {
  return request(`/api/players/${encodeURIComponent(address)}`);
}

// ── Scores + leaderboard ─────────────────────────────────────────────────────

export function submitScore(payload) {
  return request("/api/scores", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchLeaderboard({
  mode = "all",
  difficulty = "all",
  opponent = "all",
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams({
    mode,
    difficulty,
    opponent,
    page: String(page),
    pageSize: String(pageSize),
  });
  return request(`/api/leaderboard?${params.toString()}`);
}
