import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PvpBoard from "../components/pvp/PvpBoard";
import { createMatchShare, fetchMatch, rematchMatch } from "../lib/pvpApi";
import {
  getBackgroundById,
  getModeById,
  resolveSnake,
} from "../lib/pvpCatalog";
import {
  getPlayerIdForRoom,
  getPlayerTokenForRoom,
  saveRoomSession,
} from "../lib/matchSession";
import { createMatchSocket } from "../lib/pvpSocket";
import { downloadPvpResultCard } from "../lib/pvpResultCard";
import { useWallet } from "../lib/walletContext";

function formatTimer(seconds) {
  if (seconds == null) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function MatchPage() {
  const navigate = useNavigate();
  const { code = "" } = useParams();
  const { snakes: ownedSnakes } = useWallet();
  const roomCode = code.toUpperCase();
  const playerId = getPlayerIdForRoom(roomCode);
  const playerToken = getPlayerTokenForRoom(roomCode);
  const socketRef = useRef(null);
  const lastSentRef = useRef({ time: 0, payload: null });
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [rematching, setRematching] = useState(false);

  const me = useMemo(
    () => room?.players?.find((p) => p.id === playerId) ?? null,
    [room, playerId],
  );
  const opponent = useMemo(
    () => room?.players?.find((p) => p.id !== playerId) ?? null,
    [room, playerId],
  );
  const snake = resolveSnake(me, ownedSnakes);
  const background = getBackgroundById(me?.backgroundId);
  const mode = getModeById(room?.mode);
  const isDraw = room?.status === "finished" && !room?.result?.winnerPlayerId;
  const isWinner =
    room?.result?.winnerPlayerId && room.result.winnerPlayerId === playerId;
  const resultLabel = isDraw ? "DRAW" : isWinner ? "YOU WIN" : "YOU LOSE";

  const sendProgress = useCallback(
    (stats) => {
      if (
        !socketRef.current ||
        !playerId ||
        !playerToken ||
        room?.status !== "playing"
      )
        return;
      const now = Date.now();
      const last = lastSentRef.current;
      const changed =
        !last.payload ||
        stats.score !== last.payload.score ||
        stats.length !== last.payload.length ||
        stats.alive !== last.payload.alive ||
        stats.applesCollected !== last.payload.applesCollected;
      if (!changed && now - last.time < 250) return;
      socketRef.current.emit("match:progress", {
        code: roomCode,
        playerId,
        playerToken,
        ...stats,
        clientTime: now,
      });
      lastSentRef.current = { time: now, payload: stats };
    },
    [playerId, playerToken, room?.status, roomCode],
  );

  useEffect(() => {
    if (!playerId || !playerToken) {
      navigate(`/play/${roomCode}`);
      return undefined;
    }

    let active = true;
    let pollTimer = null;

    const syncRoom = async () => {
      try {
        const next = await fetchMatch(roomCode);
        if (!active) return;
        setRoom(next);
        if (next.status === "waiting" || next.status === "countdown")
          navigate(`/lobby/${roomCode}`);
        if (next.status === "finished") navigate(`/results/${roomCode}`);
      } catch (err) {
        if (active) setError(err.message || "Could not load match.");
      }
    };

    void syncRoom();
    pollTimer = window.setInterval(syncRoom, 1500);

    const socket = createMatchSocket();
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("room:join", { code: roomCode, playerId, playerToken });
    });
    socket.on("room:state", (nextRoom) => {
      setRoom(nextRoom);
      if (nextRoom.status === "finished") navigate(`/results/${roomCode}`);
      if (nextRoom.status === "waiting" || nextRoom.status === "countdown")
        navigate(`/lobby/${roomCode}`);
    });
    socket.on("match:ended", () => {
      navigate(`/results/${roomCode}`);
    });
    socket.on("match:error", (payload) => {
      setError(payload.message || "Something went wrong.");
    });
    return () => {
      active = false;
      if (pollTimer) window.clearInterval(pollTimer);
      socket.disconnect();
    };
  }, [navigate, playerId, playerToken, roomCode]);

  async function handleExport() {
    if (!room) return;
    await downloadPvpResultCard({ room, me, opponent, resultLabel });
  }

  async function handleCreateShare() {
    if (!playerId || !playerToken) {
      setError("Missing player session.");
      return;
    }
    setSharing(true);
    setError("");
    try {
      const payload = await createMatchShare(roomCode, {
        playerId,
        playerToken,
      });
      setShareUrl(payload.shareUrl);
      await navigator.clipboard.writeText(payload.shareUrl).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      setError(err.message || "Could not create share link.");
    } finally {
      setSharing(false);
    }
  }

  async function handleRematch() {
    if (!playerId || !playerToken) {
      setError("Missing player session.");
      return;
    }
    setRematching(true);
    setError("");
    try {
      const payload = await rematchMatch(roomCode, { playerId, playerToken });
      saveRoomSession(payload.code, {
        playerId: payload.hostPlayerId,
        playerToken: payload.hostPlayerToken,
      });
      navigate(`/lobby/${payload.code}`);
    } catch (err) {
      setError(err.message || "Could not create rematch.");
      setRematching(false);
    }
  }

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  if (!room || !me) {
    return (
      <div className="page">
        <p className="muted">Loading match…</p>
        {error && <p className="pvp-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="page page--match">
      {/* ── Compact HUD: YOU | timer | OPPONENT ── */}
      <div className="match-hud">
        <div className="match-hud-player">
          <span className="match-hud-label">YOU</span>
          <strong className="match-hud-name">{me.nickname}</strong>
          <div className="match-hud-stats">
            <span className="match-hud-stat">
              <span className="match-hud-stat-val">{me.score}</span>
              <span className="match-hud-stat-key">pts</span>
            </span>
            <span className="match-hud-divider" />
            <span className="match-hud-stat">
              <span className="match-hud-stat-val">{me.length}</span>
              <span className="match-hud-stat-key">len</span>
            </span>
          </div>
        </div>

        <div className="match-hud-center">
          <span className="match-hud-mode">{mode.name}</span>
          <strong className="match-hud-timer">
            {formatTimer(room.remainingSeconds)}
          </strong>
        </div>

        <div className="match-hud-player match-hud-player--right">
          <span className="match-hud-label">OPP</span>
          <strong className="match-hud-name">
            {opponent?.nickname ?? "…"}
          </strong>
          <div className="match-hud-stats">
            <span className="match-hud-stat">
              <span className="match-hud-stat-val">{opponent?.score ?? 0}</span>
              <span className="match-hud-stat-key">pts</span>
            </span>
            <span className="match-hud-divider" />
            <span className="match-hud-stat">
              <span
                className="match-hud-stat-val"
                style={{ color: opponent?.alive ? "inherit" : "var(--danger)" }}
              >
                {opponent?.alive ? (opponent.length ?? 0) : "✕"}
              </span>
              <span className="match-hud-stat-key">
                {opponent?.alive ? "len" : "out"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Board + controls (rendered by PvpBoard) ── */}
      <div className="match-board-area">
        <PvpBoard
          snake={snake}
          background={background}
          running={room.status === "playing"}
          boardKey={room.startedAt || room.code}
          modeId={room.mode}
          onProgress={sendProgress}
        />
      </div>

      {shareUrl && room.status === "finished" && (
        <div className="result-share-banner">
          <div className="result-share-banner-content">
            <p className="result-share-label">🔗 Share Link (5 min)</p>
            <code className="result-share-url">{shareUrl}</code>
          </div>
          <button className="pix-btn pix-btn--ghost" onClick={copyShareUrl}>
            {shareCopied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      )}

      {room.status === "finished" && (
        <div
          className="result-actions"
          style={{ width: "100%", marginTop: "1rem" }}
        >
          <button
            className="pix-btn pix-btn--phosphor pix-btn--lg"
            onClick={() => navigate(`/results/${roomCode}`)}
          >
            View Results
          </button>
          <button
            className="pix-btn pix-btn--amber pix-btn--lg"
            onClick={handleCreateShare}
            disabled={sharing || !!shareUrl}
          >
            {sharing
              ? "Generating…"
              : shareUrl
                ? "✓ Link Created"
                : "🔗 Share Score"}
          </button>
          <button className="pix-btn pix-btn--lg" onClick={handleExport}>
            ⬇ Download Card
          </button>
          <button
            className="pix-btn pix-btn--ghost pix-btn--lg"
            onClick={handleRematch}
            disabled={rematching}
          >
            {rematching ? "Creating…" : "🔄 Rematch"}
          </button>
        </div>
      )}

      {error && <p className="pvp-error">{error}</p>}
      <button
        className="pix-btn pix-btn--ghost match-leave-btn"
        onClick={() => navigate("/")}
      >
        ← Leave Match
      </button>
    </div>
  );
}
