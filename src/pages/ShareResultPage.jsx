import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchSharedResult } from "../lib/pvpApi";

export default function ShareResultPage() {
  const navigate = useNavigate();
  const { shareId = "" } = useParams();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchSharedResult(shareId)
      .then((data) => {
        if (active) setPayload(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "This result link is no longer available.");
      });
    return () => {
      active = false;
    };
  }, [shareId]);

  if (!payload) {
    return (
      <div className="page page--wide">
        <button className="pix-btn pix-btn--ghost" onClick={() => navigate("/")}>← Arcade</button>
        <div className="panel pvp-panel-pad mt-md">
          <h1 className="page-title">Shared Match Result</h1>
          <p className="muted">{error || "Loading shared result..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--wide">
      <div className="flex-between" style={{ marginBottom: "1.2rem", gap: "0.8rem", flexWrap: "wrap" }}>
        <button className="pix-btn pix-btn--ghost" onClick={() => navigate("/")}>← Arcade</button>
        <div className="tag">Expires {new Date(payload.expiresAt).toLocaleTimeString()}</div>
      </div>
      <header className="page-head center">
        <p className="page-eyebrow">Shared Match Result</p>
        <h1 className="page-title">{payload.resultLabel}</h1>
        <p className="page-sub">{payload.room.result?.reason || payload.room.mode}</p>
      </header>
      <div className="pvp-results-grid">
        {payload.room.players.map((player) => (
          <article key={player.id} className="panel pvp-panel-pad">
            <h3 className="section-title">{player.nickname}</h3>
            <dl className="pvp-meta-list">
              <div><dt>Score</dt><dd>{player.score}</dd></div>
              <div><dt>Length</dt><dd>{player.length}</dd></div>
              <div><dt>Apples</dt><dd>{player.applesCollected}</dd></div>
              <div><dt>Status</dt><dd>{player.alive ? "Alive" : "Out"}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
