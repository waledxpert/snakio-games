const KEY_PREFIX = "snakio:pvp:room:";

function key(code) {
  return `${KEY_PREFIX}${code}`;
}

export function readRoomSession(code) {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(key(code)) || "{}") || {};
  } catch {
    return {};
  }
}

export function saveRoomSession(code, patch) {
  if (typeof window === "undefined") return {};
  const next = { ...readRoomSession(code), ...patch };
  sessionStorage.setItem(key(code), JSON.stringify(next));
  return next;
}

export function getPlayerIdForRoom(code) {
  return readRoomSession(code).playerId ?? null;
}

export function getPlayerTokenForRoom(code) {
  return readRoomSession(code).playerToken ?? null;
}
