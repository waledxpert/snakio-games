import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMatchShare, fetchMatch, rematchMatch } from "../lib/pvpApi";
import { getPlayerIdForRoom, getPlayerTokenForRoom, saveRoomSession } from "../lib/matchSession";
import { downloadPvpResultCard } from "../lib/pvpResultCard";
import { createMatchSocket } from "../lib/pvpSocket";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { code = "" } = useParams();
  const roomCode = code.toUpperCase();
  const playerId = getPlayerIdForRoom(roomCode);
  const playerToken = getPlayerTokenForRoom(roomCode);
  const socketRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [rematching, setRematching] = useState(false);
  const [rematchInviteUrl, setRematchInviteUrl] = useState("");

  useEffect(() => {
    let active = true;
    fetchMatch(roomCode)
      .then((next) => {
        if (!active) return;
        setRoom(next);
        if (next.rematchInviteUrl) setRematchInviteUrl(next.rematchInviteUrl);
      })
      .catch((err) => { if (active) setError(err.message || "Could not load results."); });

    const socket = createMatchSocket();
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("room:join", { code: roomCode, playerId, playerToken });
    });
    socket.on("room:state", (nextRoom) => {
      if (!active) return;
      setRoom(nextRoom);
      if (nextRoom.rematchInviteUrl) setRematchInviteUrl(nextRoom.rematchInviteUrl);
    });
    return () => { active = false; socket.disconnect(); };
  }, [roomCode, playerId, playerToken]);

  const me = useMemo(
    () => room?.players?.find((p) => p.id === playerId) ?? null,
    [room, playerId],
  );
  const opponent = useMemo(
    () => room?.players?.find((p) => p.id !== playerId) ?? null,
    [room, playerId],
  );
  const isWinner = room?.result?.winnerPlayerId && room.result.winnerPlayerId === playerId;
  const isDraw = !room?.result?.winnerPlayerId;
  const resultLabel = isDraw ? "DRAW" : isWinner ? "YOU WIN" : "YOU LOSE";

  async function handleExport() {
    if (!room) return;
    await downloadPvpResultCard({ room, me, opponent, resultLabel });
  }

  async function handleCreateShare() {
    if (!playerId || !playerToken) { setError("Missing player session."); return; }
    setSharing(true);
    setError("");
    try {
      const payload = await createMatchShare(roomCode, { playerId, playerToken });
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
    if (!playerId || !playerToken) { setError("Missing player session."); return; }
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

  if (!room) {
    return (
      <div className="page">
        <div className="result-loading">
          <span className="spinner" />
          <p className="muted">Loading results…</p>
          {error && <p className="pvp-error">{error}</p>}
        </div>
      </div>
    );
  }

  const resultEmoji = isDraw ? "🤝" : isWinner ? "🏆" : "💀";
  const resultColor = isDraw ? "var(--amber)" : isWinner ? "var(--phosphor)" : "var(--danger)";

  return (
    <div className="page result-page">
      {/* Hero */}
      <div className="result-hero" style={{ "--result-color": resultColor }}>
        <span className="result-emoji">{resultEmoji}</span>
        <h1 className="result-headline">{resultLabel}</h1>
        <p className="result-reason">{room.result?.reason || "Match complete."}</p>
        <div className="result-room-tag">Room {roomCode}</div>
      </div>

      {/* Scoreboard */}
      <div className="result-scores">
        <div className={`result-score-card${isWinner ? " result-score-card--winner" : ""}`}>
          <div className="result-score-label">
            <span className="page-eyebrow">YOU</span>
            {isWinner && <span className="result-crown">👑</span>}
          </div>
          <strong className="result-player-name">{me?.nickname ?? "—"}</strong>
          <div className="result-stats-grid">
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: "var(--phosphor)" }}>{me?.score ?? 0}</span>
              <span className="result-stat-label">Score</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val">{me?.length ?? 0}</span>
              <span className="result-stat-label">Length</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: "var(--amber)" }}>{me?.applesCollected ?? 0}</span>
              <span className="result-stat-label">Apples</span>
            </div>
          </div>
        </div>

        <div className="result-vs">VS</div>

        <div className={`result-score-card${!isDraw && !isWinner ? " result-score-card--winner" : ""}`}>
          <div className="result-score-label">
            <span className="page-eyebrow">OPPONENT</span>
            {!isDraw && !isWinner && <span className="result-crown">👑</span>}
          </div>
          <strong className="result-player-name">{opponent?.nickname ?? "—"}</strong>
          <div className="result-stats-grid">
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: "var(--phosphor)" }}>{opponent?.score ?? 0}</span>
              <span className="result-stat-label">Score</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val">{opponent?.length ?? 0}</span>
              <span className="result-stat-label">Length</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: "var(--amber)" }}>{opponent?.applesCollected ?? 0}</span>
              <span className="result-stat-label">Apples</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share link banner */}
      {shareUrl && (
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

      {/* Opponent rematch invite */}
      {rematchInviteUrl && !room?.rematchCode && (
        <div className="result-share-banner result-share-banner--rematch">
          <div className="result-share-banner-content">
            <p className="result-share-label">🔄 Opponent started a rematch!</p>
            <code className="result-share-url">{rematchInviteUrl}</code>
          </div>
          <button
            className="pix-btn pix-btn--phosphor"
            onClick={() => navigate(`/play/${room.rematchCode}`)}
          >
            Join
          </button>
        </div>
      )}

      {error && <p className="pvp-error" style={{ textAlign: "center" }}>{error}</p>}

      {/* Action buttons */}
      <div className="result-actions">
        <button
          className="pix-btn pix-btn--phosphor pix-btn--lg result-action-rematch"
          onClick={handleRematch}
          disabled={rematching}
          id="rematch-btn"
        >
          {rematching ? <><span className="spinner" /> Creating…</> : <>🔄 Rematch</>}
        </button>

        <button
          className="pix-btn pix-btn--amber pix-btn--lg"
          onClick={handleCreateShare}
          disabled={sharing || !!shareUrl}
          id="share-btn"
        >
          {sharing ? <><span className="spinner" /> Generating…</> : shareUrl ? "✓ Link Created" : "🔗 Share Score"}
        </button>

        <button className="pix-btn pix-btn--lg" onClick={handleExport} id="download-btn">
          ⬇ Download Card
        </button>

        <button className="pix-btn pix-btn--ghost pix-btn--lg" onClick={() => navigate("/")} id="leave-btn">
          ← Home
        </button>
      </div>
    </div>
  );
}
