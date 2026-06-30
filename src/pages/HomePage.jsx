import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const joinCode = code.trim().toUpperCase();

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
          ← Arcade
        </button>
        <div className="tag">Private PvP</div>
      </div>

      <section className="hero-card">
        <p className="page-eyebrow">Private 1v1 Snake</p>
        <h1 className="page-title">Snake PvP</h1>
        <p className="page-sub">
          Create a private match, pick your snake and background, invite a
          friend, and race on separate boards, share your scores.
        </p>

        <div className="pvp-cta-row">
          <button
            className="pix-btn pix-btn--phosphor pix-btn--lg"
            onClick={() => navigate("/create-match")}
          >
            Create Match
          </button>
          <button
            className="pix-btn pix-btn--ghost pix-btn--lg"
            onClick={() => navigate("/create-match")}
          >
            Play
          </button>
        </div>

        <div className="panel pvp-join-inline">
          <label className="pvp-field" style={{ margin: 0 }}>
            <span className="pvp-field-label">Have an invite code?</span>
            <div className="pvp-inline-form">
              <input
                className="pvp-input"
                placeholder="ABCD12"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              <button
                className="pix-btn pix-btn--amber"
                disabled={!joinCode}
                onClick={() => navigate(`/play/${joinCode}`)}
              >
                Join Match
              </button>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
}
