import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadoutForm from "../components/pvp/LoadoutForm";
import {
  buildModeSettings,
  createDefaultSettings,
  GAME_MODES,
  getModeById,
} from "../lib/pvpCatalog";
import { createMatch } from "../lib/pvpApi";
import { saveRoomSession } from "../lib/matchSession";
import { useWallet } from "../lib/walletContext";

export default function CreateMatchPage() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const [loadout, setLoadout] = useState({
    nickname: "Host",
    snakeId: 10101,
    snake: null,
    backgroundId: "lcd-classic",
  });
  const [modeId, setModeId] = useState("time_attack");
  const [settingValue, setSettingValue] = useState(
    createDefaultSettings("time_attack").durationSeconds,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedMode = useMemo(() => getModeById(modeId), [modeId]);

  useEffect(() => {
    const defaults = createDefaultSettings(modeId);
    const key = selectedMode.setting?.key;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (key) setSettingValue(defaults[key]);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setSettingValue(null);
  }, [modeId, selectedMode.setting?.key]);

  async function handleCreateMatch() {
    setSubmitting(true);
    setError("");
    try {
      const room = await createMatch({
        hostPlayer: {
          nickname: loadout.nickname.trim() || "Host",
          snakeId: loadout.snakeId,
          snake: loadout.snake,
          backgroundId: loadout.backgroundId,
          walletAddress: address || null,
        },
        mode: modeId,
        settings: buildModeSettings(modeId, settingValue),
      });
      saveRoomSession(room.code, {
        playerId: room.hostPlayerId,
        playerToken: room.hostPlayerToken,
        role: "host",
      });
      navigate(`/lobby/${room.code}`);
    } catch (err) {
      setError(err.message || "Could not create match.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="pvp-page-nav">
        <button className="pix-btn pix-btn--ghost" onClick={() => navigate("/")}>
          ← Home
        </button>
        <div className="tag">Host Setup</div>
      </div>

      <header className="page-head">
        <p className="page-eyebrow">New PvP Room</p>
        <h1 className="page-title">Create Match</h1>
        <p className="page-sub">
          Set up your loadout and pick a mode, then share the invite link with
          your opponent.
        </p>
      </header>

      {/* Two-col on desktop, single-col on mobile */}
      <div className="pvp-create-grid">
        {/* Left: Loadout */}
        <div className="panel pvp-panel-pad">
          <LoadoutForm value={loadout} onChange={setLoadout} disabled={submitting} />
        </div>

        {/* Right: Mode + submit */}
        <div className="pvp-create-side">
          <div className="panel pvp-panel-pad">
            <h3 className="section-title">Game Mode</h3>
            <div className="pvp-mode-grid">
              {GAME_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`pvp-mode-card ${mode.id === modeId ? "pvp-mode-card--active" : ""}`}
                  onClick={() => setModeId(mode.id)}
                >
                  <strong>{mode.name}</strong>
                  <span>{mode.summary}</span>
                </button>
              ))}
            </div>

            {selectedMode.setting && (
              <div className="mt-md">
                <h4 className="section-title">{selectedMode.setting.label}</h4>
                <div className="pvp-setting-row">
                  {selectedMode.setting.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`pix-btn ${settingValue === option.value ? "pix-btn--phosphor" : "pix-btn--ghost"}`}
                      onClick={() => setSettingValue(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!address && (
              <div className="pvp-summary-box mt-md">
                <p className="muted" style={{ margin: 0 }}>
                  Connect your wallet to use your own Snakiox NFT.
                </p>
              </div>
            )}
          </div>

          {error && <p className="pvp-error">{error}</p>}

          <button
            className="pix-btn pix-btn--phosphor pix-btn--lg pix-btn--block"
            onClick={handleCreateMatch}
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Generate Invite Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
