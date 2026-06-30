import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMatch } from "../lib/pvpApi";
import {
  getBackgroundById,
  getModeById,
  resolveSnake,
} from "../lib/pvpCatalog";
import { getPlayerIdForRoom, getPlayerTokenForRoom } from "../lib/matchSession";
import { createMatchSocket } from "../lib/pvpSocket";
import SnakeAvatar from "../components/SnakeAvatar";
import { useWallet } from "../lib/walletContext";

function PlayerLobbyCard({ player, isMe, ownedSnakes }) {
  const snake = resolveSnake(player, ownedSnakes);
  const background = getBackgroundById(player.backgroundId);
  return (
    <article className="panel pvp-player-card">
      <div
        className="flex-between"
        style={{ gap: "0.8rem", alignItems: "center" }}
      >
        <div>
          <p className="page-eyebrow" style={{ marginBottom: "0.25rem" }}>
            {isMe ? "YOU" : player.role.toUpperCase()}
          </p>
          <h3 className="section-title" style={{ margin: 0 }}>
            {player.nickname}
          </h3>
        </div>
        <span className={`tag ${player.ready ? "tag--ok" : "tag--wait"}`}>
          {player.ready ? "Ready" : "Not ready"}
        </span>
      </div>
      <div className="pvp-player-preview">
        <SnakeAvatar token={snake} len={14} stepRate={5} />
        <div className="stack gap-sm">
          <strong>{snake.traits.skin}</strong>
          <span>{background.name}</span>
          <span className="muted">
            {player.connected ? "Connected" : "Disconnected"}
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
    () => room?.players?.find((player) => player.id === playerId) ?? null,
    [room, playerId],
  );
  const opponent = useMemo(
    () => room?.players?.find((player) => player.id !== playerId) ?? null,
    [room, playerId],
  );
  const selectedMode = getModeById(room?.mode);
  const canStart = Boolean(
    me?.role === "host" &&
    room?.players?.length === 2 &&
    room.players.every((player) => player.ready),
  );

  useEffect(() => {
    if (!playerId || !playerToken) {
      navigate(`/play/${roomCode}`);
      return undefined;
    }

    let active = true;
    fetchMatch(roomCode)
      .then((next) => {
        if (active) setRoom(next);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load lobby.");
      });

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
    socket.on("match:countdown", (payload) => {
      setCountdown(payload.count);
    });
    socket.on("match:error", (payload) => {
      setError(payload.message || "Something went wrong.");
    });

    return () => {
      active = false;
      socket.disconnect();
    };
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
        <p className="muted">Loading lobby…</p>
      </div>
    );
  }

  return (
    <div className="page page--wide">
      <div
        className="flex-between"
        style={{ marginBottom: "1.2rem", flexWrap: "wrap", gap: "0.8rem" }}
      >
        <button
          className="pix-btn pix-btn--ghost pix-btn--lg"
          onClick={() => navigate("/")}
        >
          ← Home
        </button>
        <div className="tag">Lobby · {room.code}</div>
      </div>

      <header className="page-head">
        <p className="page-eyebrow">Backend-owned room state</p>
        <h1 className="page-title">Match Lobby</h1>
        <p className="page-sub">
          The lobby is controlled by Socket.IO. Players join with their stored
          player IDs, toggle ready, and the host starts the shared countdown.
        </p>
      </header>

      <div className="pvp-two-col">
        <section>
          <div className="pvp-player-stack">
            {me && (
              <PlayerLobbyCard player={me} isMe ownedSnakes={ownedSnakes} />
            )}
            {opponent ? (
              <PlayerLobbyCard player={opponent} ownedSnakes={ownedSnakes} />
            ) : (
              <article className="panel pvp-player-card pvp-player-card--empty">
                <h3 className="section-title">Waiting for friend</h3>
                <p className="muted">
                  Share this invite link to bring your opponent into the room.
                </p>
                <code className="pvp-code-box">{room.inviteUrl}</code>
                <button
                  className="pix-btn pix-btn--phosphor"
                  type="button"
                  onClick={copyInvite}
                >
                  {copiedInvite ? "Copied ✓" : "Copy Invite"}
                </button>
              </article>
            )}
          </div>
        </section>

        <aside className="panel pvp-panel-pad">
          <h3 className="section-title">Room Rules</h3>
          <dl className="pvp-meta-list">
            <div>
              <dt>Mode</dt>
              <dd>{selectedMode.name}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{room.status}</dd>
            </div>
            <div>
              <dt>Players</dt>
              <dd>{room.players.length}/2</dd>
            </div>
            {Object.entries(room.settings || {}).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>

          {/* <div className="pvp-summary-box mt-md">
            <h3 className="section-title">Frontend ↔ backend</h3>
            <ul>
              <li>REST loaded the room summary.</li>
              <li>Socket.IO now keeps the room state live.</li>
              <li>The host can only start once both players are ready.</li>
            </ul>
          </div> */}

          {error && <p className="pvp-error">{error}</p>}
          {countdown !== null && (
            <p className="tag mt-md">Starting in {countdown}…</p>
          )}
          <button
            className="pix-btn pix-btn--ghost pix-btn--block mt-md"
            type="button"
            onClick={copyInvite}
          >
            {copiedInvite ? "Invite Copied ✓" : "Copy Invite Link"}
          </button>

          <div className="pvp-action-stack mt-md">
            <button
              className={`pix-btn pix-btn--lg pix-btn--block ${me?.ready ? "pix-btn--ghost" : "pix-btn--phosphor"}`}
              onClick={() =>
                socketRef.current?.emit("player:setReady", {
                  code: roomCode,
                  playerId,
                  playerToken,
                  ready: !me?.ready,
                })
              }
            >
              {me?.ready ? "Set Not Ready" : "Set Ready"}
            </button>
            {me?.role === "host" && (
              <button
                className="pix-btn pix-btn--amber pix-btn--lg pix-btn--block"
                disabled={!canStart}
                onClick={() =>
                  socketRef.current?.emit("match:start", {
                    code: roomCode,
                    playerId,
                    playerToken,
                  })
                }
              >
                Start Match
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
