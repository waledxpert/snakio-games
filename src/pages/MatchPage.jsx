import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PvpBoard from "../components/pvp/PvpBoard";
import { fetchMatch } from "../lib/pvpApi";
import {
  getBackgroundById,
  getModeById,
  resolveSnake,
} from "../lib/pvpCatalog";
import { getPlayerIdForRoom, getPlayerTokenForRoom } from "../lib/matchSession";
import { createMatchSocket } from "../lib/pvpSocket";
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

  const me = useMemo(
    () => room?.players?.find((player) => player.id === playerId) ?? null,
    [room, playerId],
  );
  const opponent = useMemo(
    () => room?.players?.find((player) => player.id !== playerId) ?? null,
    [room, playerId],
  );
  const snake = resolveSnake(me, ownedSnakes);
  const background = getBackgroundById(me?.backgroundId);
  const mode = getModeById(room?.mode);

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
    fetchMatch(roomCode)
      .then((next) => {
        if (!active) return;
        setRoom(next);
        if (next.status === "waiting" || next.status === "countdown")
          navigate(`/lobby/${roomCode}`);
        if (next.status === "finished") navigate(`/results/${roomCode}`);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load match.");
      });

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
    socket.on("match:error", (payload) => {
      setError(payload.message || "Something went wrong.");
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [navigate, playerId, playerToken, roomCode]);

  if (!room || !me) {
    return (
      <div className="page">
        <p className="muted">Loading match…</p>
      </div>
    );
  }

  return (
    <div className="page page--wide pvp-match-page">
      <div className="pvp-match-bar">
        <div className="panel pvp-score-card">
          <span className="page-eyebrow">YOU</span>
          <strong>{me.nickname}</strong>
          <span>Length {me.length}</span>
          <span>Score {me.score}</span>
        </div>
        <div className="panel pvp-timer-card">
          <span className="page-eyebrow">{mode.name}</span>
          <strong>{formatTimer(room.remainingSeconds)}</strong>
        </div>
        <div className="panel pvp-score-card pvp-score-card--right">
          <span className="page-eyebrow">OPPONENT</span>
          <strong>{opponent?.nickname ?? "Waiting"}</strong>
          <span>Length {opponent?.length ?? 0}</span>
          <span>Score {opponent?.score ?? 0}</span>
          <span>{opponent?.alive ? "Alive" : "Out"}</span>
        </div>
      </div>

      <div className="pvp-match-grid">
        <div className="panel pvp-board-panel">
          <PvpBoard
            snake={snake}
            background={background}
            running={room.status === "playing"}
            boardKey={room.startedAt || room.code}
            onProgress={sendProgress}
          />
        </div>

        <aside className="panel pvp-panel-pad">
          <h3 className="section-title">Live Match</h3>
          <dl className="pvp-meta-list">
            <div>
              <dt>Mode</dt>
              <dd>{mode.name}</dd>
            </div>
            <div>
              <dt>Your Snake</dt>
              <dd>{snake.traits.skin}</dd>
            </div>
            <div>
              <dt>Background</dt>
              <dd>{background.name}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{me.alive ? "Alive" : "Crashed"}</dd>
            </div>
          </dl>

          {/* <div className="pvp-summary-box mt-md">
            <h3 className="section-title">What the server tracks</h3>
            <ul>
              <li>Your score, length, apples, and alive/dead state</li>
              <li>Your opponent's latest progress snapshot</li>
              <li>Timer expiry and mode-specific winner rules</li>
            </ul>
          </div> */}

          {error && <p className="pvp-error">{error}</p>}
          <button
            className="pix-btn pix-btn--ghost pix-btn--block mt-md"
            onClick={() => navigate("/")}
          >
            Leave Match
          </button>
        </aside>
      </div>
    </div>
  );
}
