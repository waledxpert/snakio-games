import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadoutForm from "../components/pvp/LoadoutForm";
import { fetchMatch, joinMatch } from "../lib/pvpApi";
import { describeMode } from "../lib/pvpCatalog";
import { getPlayerIdForRoom, saveRoomSession } from "../lib/matchSession";
import { useWallet } from "../lib/walletContext";

export default function JoinMatchPage() {
  const navigate = useNavigate();
  const { code = "" } = useParams();
  const { address } = useWallet();
  const roomCode = code.toUpperCase();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadout, setLoadout] = useState({
    nickname: "Guest",
    snakeId: 20202,
    snake: null,
    backgroundId: "cathode-green",
  });

  const existingPlayerId = getPlayerIdForRoom(roomCode);
  const matchIsFull = useMemo(() => room?.players?.length >= 2, [room]);

  useEffect(() => {
    let cancelled = false;
    async function loadRoom() {
      try {
        setLoading(true);
        const next = await fetchMatch(roomCode);
        if (!cancelled) setRoom(next);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load match.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadRoom();
    return () => { cancelled = true; };
  }, [roomCode]);

  async function handleJoin() {
    setSubmitting(true);
    setError("");
    try {
      const response = await joinMatch(roomCode, {
        guestPlayer: {
          nickname: loadout.nickname.trim() || "Guest",
          snakeId: loadout.snakeId,
          snake: loadout.snake,
          backgroundId: loadout.backgroundId,
          walletAddress: address || null,
        },
      });
      saveRoomSession(roomCode, {
        playerId: response.guestPlayerId,
        playerToken: response.guestPlayerToken,
        role: "guest",
      });
      navigate(`/lobby/${roomCode}`);
    } catch (err) {
      setError(err.message || "Could not join match.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="pvp-loading-state">
          <span className="spinner" />
          <p className="muted">Loading match…</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="page">
        <button className="pix-btn pix-btn--ghost" onClick={() => navigate("/")}>← Home</button>
        <p className="pvp-error mt-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pvp-page-nav">
        <button className="pix-btn pix-btn--ghost" onClick={() => navigate("/")}>← Home</button>
        <div className="tag">Code · {roomCode}</div>
      </div>

      <header className="page-head">
        <p className="page-eyebrow">Invite</p>
        <h1 className="page-title">Join Match</h1>
        <p className="page-sub">Choose your snake and backdrop, then join.</p>
      </header>

      {/* Room info strip */}
      <div className="pvp-room-info">
        <div className="pvp-room-info-item">
          <span className="pvp-room-info-label">Mode</span>
          <span className="pvp-room-info-val">{describeMode(room.mode, room.settings)}</span>
        </div>
        <div className="pvp-room-info-item">
          <span className="pvp-room-info-label">Host</span>
          <span className="pvp-room-info-val">{room.players[0]?.nickname ?? "—"}</span>
        </div>
        <div className="pvp-room-info-item">
          <span className="pvp-room-info-label">Status</span>
          <span className="pvp-room-info-val">{room.status}</span>
        </div>
      </div>

      {existingPlayerId && (
        <div className="pvp-summary-box">
          <p className="muted" style={{ margin: "0 0 0.75rem" }}>
            You already joined this room on this device.
          </p>
          <button
            className="pix-btn pix-btn--phosphor"
            onClick={() => navigate(`/lobby/${roomCode}`)}
          >
            Open Lobby
          </button>
        </div>
      )}

      {matchIsFull && !existingPlayerId ? (
        <div className="pvp-summary-box">
          <h3 className="section-title" style={{ marginTop: 0 }}>Room Full</h3>
          <p className="muted">This invite already has two players.</p>
        </div>
      ) : !existingPlayerId ? (
        <div className="panel pvp-panel-pad">
          <LoadoutForm value={loadout} onChange={setLoadout} disabled={submitting} />
          {error && <p className="pvp-error">{error}</p>}
          <button
            className="pix-btn pix-btn--phosphor pix-btn--lg pix-btn--block"
            style={{ marginTop: "1.25rem" }}
            onClick={handleJoin}
            disabled={submitting}
          >
            {submitting ? "Joining…" : "Ready Up"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
