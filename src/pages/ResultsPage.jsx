import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMatchShare, fetchMatch } from "../lib/pvpApi";
import { getPlayerIdForRoom, getPlayerTokenForRoom } from "../lib/matchSession";
import { downloadPvpResultCard } from "../lib/pvpResultCard";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { code = "" } = useParams();
  const roomCode = code.toUpperCase();
  const playerId = getPlayerIdForRoom(roomCode);
  const playerToken = getPlayerTokenForRoom(roomCode);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    let active = true;
    fetchMatch(roomCode)
      .then((next) => {
        if (active) setRoom(next);
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load results.");
      });
    return () => {
      active = false;
    };
  }, [roomCode]);

  const me = useMemo(
    () => room?.players?.find((player) => player.id === playerId) ?? null,
    [room, playerId],
  );
  const opponent = useMemo(
    () => room?.players?.find((player) => player.id !== playerId) ?? null,
    [room, playerId],
  );
  const isWinner =
    room?.result?.winnerPlayerId && room.result.winnerPlayerId === playerId;
  const resultLabel = room?.result?.winnerPlayerId
    ? isWinner
      ? "YOU WIN"
      : "YOU LOSE"
    : "DRAW";

  async function handleExport() {
    if (!room) return;
    await downloadPvpResultCard({ room, me, opponent, resultLabel });
  }

  async function handleCreateShare() {
    if (!playerId || !playerToken) {
      setError("Missing player session for sharing this result.");
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
      await navigator.clipboard.writeText(payload.shareUrl);
    } catch (err) {
      setError(err.message || "Could not create share link.");
    } finally {
      setSharing(false);
    }
  }

  if (!room) {
    return (
      <div className="page">
        <p className="muted">Loading results…</p>
        {error && <p className="pvp-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="page page--wide">
      <header className="page-head center">
        <p className="page-eyebrow">Results</p>
        <h1 className="page-title">
          {room.result?.winnerPlayerId
            ? isWinner
              ? "🏆 You Win"
              : "You Lose"
            : "Draw"}
        </h1>
        <p className="page-sub">
          {room.result?.reason ||
            "The backend resolved the match and stored the final state."}
        </p>
      </header>

      <div className="pvp-results-grid">
        <article className="panel pvp-panel-pad">
          <h3 className="section-title">You</h3>
          <dl className="pvp-meta-list">
            <div>
              <dt>Nickname</dt>
              <dd>{me?.nickname ?? "—"}</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>{me?.length ?? 0}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>{me?.score ?? 0}</dd>
            </div>
            <div>
              <dt>Apples</dt>
              <dd>{me?.applesCollected ?? 0}</dd>
            </div>
          </dl>
        </article>
        <article className="panel pvp-panel-pad">
          <h3 className="section-title">Opponent</h3>
          <dl className="pvp-meta-list">
            <div>
              <dt>Nickname</dt>
              <dd>{opponent?.nickname ?? "—"}</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>{opponent?.length ?? 0}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>{opponent?.score ?? 0}</dd>
            </div>
            <div>
              <dt>Apples</dt>
              <dd>{opponent?.applesCollected ?? 0}</dd>
            </div>
          </dl>
        </article>
      </div>

      {shareUrl && (
        <div className="panel pvp-panel-pad mt-md">
          <h3 className="section-title">Share Link</h3>
          <code className="pvp-code-box">{shareUrl}</code>
          <p className="muted" style={{ marginTop: "0.7rem" }}>
            Copied to clipboard. This link expires in 5 minutes.
          </p>
        </div>
      )}

      {error && <p className="pvp-error center">{error}</p>}

      <div
        className="pvp-cta-row"
        style={{ justifyContent: "center", marginTop: "1.4rem" }}
      >
        <button
          className="pix-btn pix-btn--amber pix-btn--lg"
          onClick={handleExport}
        >
          Export Score Card
        </button>
        <button
          className="pix-btn pix-btn--phosphor pix-btn--lg"
          onClick={handleCreateShare}
          disabled={sharing}
        >
          {sharing ? "Creating Link..." : "Create 5-Min Share Link"}
        </button>
        <button
          className="pix-btn pix-btn--ghost pix-btn--lg"
          onClick={() => navigate("/pvp")}
        >
          Play Again
        </button>
        <button
          className="pix-btn pix-btn--ghost pix-btn--lg"
          onClick={() => navigate("/")}
        >
          Leave Match
        </button>
      </div>
    </div>
  );
}
