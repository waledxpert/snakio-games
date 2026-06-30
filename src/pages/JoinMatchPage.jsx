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
    return () => {
      cancelled = true;
    };
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
        <p className="muted">Loading match…</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="page">
        <button
          className="pix-btn pix-btn--ghost"
          onClick={() => navigate("/")}
        >
          ← Home
        </button>
        <p className="pvp-error mt-md">{error}</p>
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
        <div className="tag">Invite code · {roomCode}</div>
      </div>

      <header className="page-head">
        <p className="page-eyebrow">Join flow</p>
        <h1 className="page-title">Join Match</h1>
        <p className="page-sub">
          The backend shares room mode and availability here. Once you choose
          your setup, the frontend sends your player data and moves you into the
          lobby.
        </p>
      </header>

      <div className="pvp-two-col">
        <section className="panel pvp-panel-pad">
          <h3 className="section-title">Match Info</h3>
          <dl className="pvp-meta-list">
            <div>
              <dt>Mode</dt>
              <dd>{describeMode(room.mode, room.settings)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{room.status}</dd>
            </div>
            <div>
              <dt>Host</dt>
              <dd>{room.players[0]?.nickname ?? "Waiting"}</dd>
            </div>
          </dl>

          {existingPlayerId && (
            <div className="pvp-summary-box mt-md">
              <p className="muted" style={{ margin: 0 }}>
                You already joined this room on this browser. You can go
                straight back to the lobby.
              </p>
              <button
                className="pix-btn pix-btn--phosphor mt-sm"
                onClick={() => navigate(`/lobby/${roomCode}`)}
              >
                Open Lobby
              </button>
            </div>
          )}
        </section>

        <section className="panel pvp-panel-pad">
          {matchIsFull && !existingPlayerId ? (
            <div className="pvp-summary-box">
              <h3 className="section-title">Room full</h3>
              <p className="muted">
                This invite already has a guest player attached.
              </p>
            </div>
          ) : (
            <>
              <LoadoutForm
                value={loadout}
                onChange={setLoadout}
                disabled={submitting || Boolean(existingPlayerId)}
              />
              {error && <p className="pvp-error">{error}</p>}
              {!existingPlayerId && (
                <button
                  className="pix-btn pix-btn--phosphor pix-btn--lg pix-btn--block mt-md"
                  onClick={handleJoin}
                  disabled={submitting}
                >
                  {submitting ? "Joining..." : "Ready Up"}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
