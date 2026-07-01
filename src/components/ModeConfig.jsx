import { useState } from "react";
import { DIFFICULTIES } from "../lib/pvpCatalog";

// Config panel shown when a home-page mode card is clicked. Lets the player
// pick opponent (solo / vs AI), AI difficulty, and the mode setting, then
// emits the assembled config to start the run.
export default function ModeConfig({ mode, onStart, onClose }) {
  const bothOpponents = mode.allowsSolo && mode.allowsAi;
  const [opponent, setOpponent] = useState(mode.allowsSolo ? "solo" : "ai");
  const [difficulty, setDifficulty] = useState("medium");
  const [settingValue, setSettingValue] = useState(
    mode.setting
      ? mode.setting.options[1]?.value ?? mode.setting.options[0].value
      : null,
  );

  const vsAi = opponent === "ai";

  const start = () => {
    onStart({
      mode: mode.id,
      opponent,
      difficulty: vsAi ? difficulty : null,
      settings: mode.setting ? { [mode.setting.key]: Number(settingValue) } : {},
    });
  };

  return (
    <div className="modeconfig-backdrop" onClick={onClose}>
      <div
        className="modeconfig panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <span className="panel-corner tl" /><span className="panel-corner tr" />
        <span className="panel-corner bl" /><span className="panel-corner br" />

        <p className="page-eyebrow">{mode.foot}</p>
        <h2 className="modeconfig-title">{mode.name}</h2>
        <p className="modeconfig-blurb">{mode.blurb}</p>

        {/* Opponent */}
        <div className="modeconfig-group">
          <span className="modeconfig-label">Opponent</span>
          <div className="modeconfig-choices">
            {mode.allowsSolo && (
              <button
                className={`modeconfig-chip${opponent === "solo" ? " modeconfig-chip--on" : ""}`}
                onClick={() => setOpponent("solo")}
                disabled={!bothOpponents && !mode.allowsSolo}
              >
                🎯 Solo
              </button>
            )}
            {mode.allowsAi && (
              <button
                className={`modeconfig-chip${opponent === "ai" ? " modeconfig-chip--on" : ""}`}
                onClick={() => setOpponent("ai")}
              >
                🤖 vs AI
              </button>
            )}
          </div>
          {!bothOpponents && (
            <span className="modeconfig-note">
              {mode.allowsSolo ? "Solo only." : "This mode is played against the AI."}
            </span>
          )}
        </div>

        {/* AI difficulty */}
        {vsAi && (
          <div className="modeconfig-group">
            <span className="modeconfig-label">AI Difficulty</span>
            <div className="modeconfig-choices">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={`modeconfig-chip${difficulty === d.id ? " modeconfig-chip--on" : ""}`}
                  onClick={() => setDifficulty(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode setting */}
        {mode.setting && (
          <div className="modeconfig-group">
            <span className="modeconfig-label">{mode.setting.label}</span>
            <div className="modeconfig-choices">
              {mode.setting.options.map((opt) => (
                <button
                  key={opt.value}
                  className={`modeconfig-chip${settingValue === opt.value ? " modeconfig-chip--on" : ""}`}
                  onClick={() => setSettingValue(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-sm" style={{ marginTop: "1.4rem", flexWrap: "wrap" }}>
          <button className="pix-btn pix-btn--phosphor pix-btn--lg" onClick={start}>
            ▶ Play
          </button>
          <button className="pix-btn pix-btn--ghost pix-btn--lg" onClick={onClose}>
            Cancel
          </button>
        </div>

        {vsAi && (
          <p className="modeconfig-note" style={{ marginTop: "0.8rem" }}>
            Ranked · a connected wallet is required to play vs AI.
          </p>
        )}
      </div>
    </div>
  );
}
