import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMatch } from "../lib/pvpApi";
import { getBackgroundById, getModeById, resolveSnake } from "../lib/pvpCatalog";
import { getPlayerIdForRoom, getPlayerTokenForRoom } from "../lib/matchSession";
import { createMatchSocket } from "../lib/pvpSocket";
import SnakeAvatar from "../components/SnakeAvatar";
import { useWallet } from "../lib/walletContext";

function PlayerCard({ player, isMe, ownedSnakes }) {
  const snake = resolveSnake(player, ownedSnakes);
  const background = getBackgroundById(player.backgroundId);
  return (
    <article className="lobby-player-card panel">
      <div className="lobby-player-header">
        <div style={{ minWidth: 0 }}>
          <p className="page-eyebrow" style={{ margin: "0 0 0.2rem" }}>
            {isMe ? "YOU" : player.role?.toUpperCase()}
          </p>
          <h3 className="lobby-player-name">{player.nickname}</h3>
        </div>
        <span className={`lobby-ready-badge${player.ready ? " lobby-ready-badge--ok" : ""}`}>
          {player.ready ? "✓ Ready" : "Not ready"}
        </span>
      </div>

      <div className="lobby-player-preview">
        <div className="lobby-avatar-wrap">
          <SnakeAvatar token={snake} len={14} stepRate={5} />
        </div>
        <div className="lobby-player-meta">
          <span className="lobby-meta-skin">{snake.traits.skin}</span>
          <span className="lobby-meta-bg">{background.name}</span>
          <span
            className="lobby-meta-status"
            style={{ color: player.connected ? "var(--phosphor-dim)" : "var(--ink-faint)" }}
          >
            {player.connected ? "● Connected" : "○ Disconnected"}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function LobbyPage() {
  const navigate = useNavigate();
  const { code = "" } = useParams();
  const { snakes: ownedSnakes } = useWallet();
  const roomCode = code.toUpperCase();
  const playerId = getPlayerIdForRoom(roomCode);
  const playerToken = getPlayerTokenForRoom(roomCode);
  const socketRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const me = useMemo(
    () => room?.players?.find((p) => p.id === playerId) ?? null,
    [room, playerId],
  );
  const opponent = useMemo(
    () => room?.players?.find((p) => p.id !== playerId) ?? null,
    [room, playerId],
  );
  const selectedMode = getModeById(room?.mode);
  const canStart = Boolean(
    me?.role === "host" &&
    room?.players?.length === 2 &&
    room.players.every((p) => p.ready),
  );

  useEffect(() => {
    if (!playerId || !playerToken) {
      navigate(`/play/${roomCode}`);
      return undefined;
    }
    let active = true;
    fetchMatch(roomCode)
      .then((next) => { if (active) setRoom(next); })
      .catch((err) => { if (active) setError(err.message || "Could not load lobby."); });

    const socket = createMatchSocket();
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("room:join", { code: roomCode, playerId, playerToken });
    });
    socket.on("room:state", (nextRoom) => {
      setRoom(nextRoom);
      setError("");
      if (nextRoom.status === "playing") navigate(`/match/${roomCode}`);
      if (nextRoom.status === "finished") navigate(`/results/${roomCode}`);
    });
    socket.on("match:countdown", (payload) => setCountdown(payload.count));
    socket.on("match:error", (payload) => setError(payload.message || "Something went wrong."));
    return () => { active = false; socket.disconnect(); };
  }, [navigate, playerId, playerToken, roomCode]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(room?.inviteUrl || roomCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1400);
    } catch {
      setError("Could not copy invite link.");
    }
  }

  if (!room) {
    return (
      <div className="page">
        <div className="pvp-loading-state">
          <span className="spinner" />
          <p className="muted">Connecting to lobby…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pvp-page-nav">
        <button className="pix-btn pix-btn--ghost" onClick={() => navigate("/")}>← Home</button>
        <div className="tag">Room · {room.code}</div>
      </div>

      <header className="page-head">
        <p className="page-eyebrow">{selectedMode.name}</p>
        <h1 className="page-title">Match Lobby</h1>
      </header>

      {countdown !== null && (
        <div className="lobby-countdown-banner">
          <span className="lobby-countdown-num">{countdown}</span>
          <span className="lobby-countdown-label">Starting…</span>
        </div>
      )}

      {/* Player cards */}
      <div className="lobby-players-grid">
        {me && <PlayerCard player={me} isMe ownedSnakes={ownedSnakes} />}
        {opponent ? (
          <PlayerCard player={opponent} ownedSnakes={ownedSnakes} />
        ) : (
          <article className="lobby-player-card lobby-player-card--waiting panel">
            <h3 className="section-title" style={{ marginTop: 0 }}>Waiting for opponent</h3>
            <p className="muted">Share the invite link to bring them in.</p>
            <div className="lobby-invite-box">
              <code className="pvp-code-box">{room.inviteUrl}</code>
              <button className="pix-btn pix-btn--phosphor" type="button" onClick={copyInvite}>
                {copiedInvite ? "Copied ✓" : "Copy Link"}
              </button>
            </div>
          </article>
        )}
      </div>

      {/* Room info strip */}
      <div className="pvp-room-info">
        <div className="pvp-room-info-item">
          <span className="pvp-room-info-label">Mode</span>
          <span className="pvp-room-info-val">{selectedMode.name}</span>
        </div>
        <div className="pvp-room-info-item">
          <span className="pvp-room-info-label">Players</span>
          <span className="pvp-room-info-val">{room.players.length}/2</span>
        </div>
        <div className="pvp-room-info-item">
          <span className="pvp-room-info-label">Status</span>
          <span className="pvp-room-info-val">{room.status}</span>
        </div>
        {Object.entries(room.settings || {}).map(([key, value]) => (
          <div key={key} className="pvp-room-info-item">
            <span className="pvp-room-info-label">{key}</span>
            <span className="pvp-room-info-val">{String(value)}</span>
          </div>
        ))}
      </div>

      {error && <p className="pvp-error">{error}</p>}

      {opponent && (
        <button className="pix-btn pix-btn--ghost pix-btn--block" type="button" onClick={copyInvite}>
          {copiedInvite ? "Invite Copied ✓" : "Copy Invite Link"}
        </button>
      )}

      {/* Actions */}
      <div className="lobby-actions">
        <button
          className={`pix-btn pix-btn--lg ${me?.ready ? "pix-btn--ghost" : "pix-btn--phosphor"} lobby-ready-btn`}
          onClick={() =>
            socketRef.current?.emit("player:setReady", {
              code: roomCode, playerId, playerToken, ready: !me?.ready,
            })
          }
        >
          {me?.ready ? "✓ Ready — Undo" : "Set Ready"}
        </button>

        {me?.role === "host" && (
          <button
            className="pix-btn pix-btn--amber pix-btn--lg lobby-start-btn"
            disabled={!canStart}
            onClick={() =>
              socketRef.current?.emit("match:start", {
                code: roomCode, playerId, playerToken,
              })
            }
          >
            Start Match
          </button>
        )}
      </div>
    </div>
  );
}
