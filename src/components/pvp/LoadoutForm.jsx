import { useEffect, useMemo, useRef } from "react";
import SnakeAvatar from "../SnakeAvatar";
import {
  BACKGROUNDS,
  createSnakeSnapshot,
  getSnakeChoices,
  getSnakeById,
} from "../../lib/pvpCatalog";
import { useWallet } from "../../lib/walletContext";

function BgThumb({ background }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    background.paint(ctx, width, height, 12);
  }, [background]);

  return <canvas ref={ref} className="pvp-bg-thumb" />;
}

export default function LoadoutForm({ value, onChange, disabled = false }) {
  const {
    address,
    snakes: ownedSnakes,
    loadingSnakes,
    loadError,
    loadedSnakesOnce,
    reloadSnakes,
  } = useWallet();

  const snakeChoices = useMemo(
    () => getSnakeChoices(ownedSnakes),
    [ownedSnakes],
  );
  const selectedSnake = getSnakeById(value.snakeId, snakeChoices);

  useEffect(() => {
    if (!selectedSnake) return;
    const hasSelected = snakeChoices.some(
      (snake) => String(snake.tokenId) === String(value.snakeId),
    );
    const nextSnake = hasSelected ? selectedSnake : snakeChoices[0];
    const nextSnapshot = createSnakeSnapshot(nextSnake);
    const snapshotChanged =
      JSON.stringify(value.snake) !== JSON.stringify(nextSnapshot);
    if (!hasSelected || snapshotChanged) {
      onChange({ ...value, snakeId: nextSnake.tokenId, snake: nextSnapshot });
    }
  }, [onChange, selectedSnake, snakeChoices, value]);

  const setField = (field, nextValue) =>
    onChange({ ...value, [field]: nextValue });
  const selectSnake = (snake) =>
    onChange({
      ...value,
      snakeId: snake.tokenId,
      snake: createSnakeSnapshot(snake),
    });

  let sourceText =
    "No wallet connected. Using preset snakes until you connect.";
  if (address) {
    if (loadingSnakes && !loadedSnakesOnce) {
      sourceText = "Loading wallet snakes...";
    } else if (loadError) {
      sourceText =
        "Wallet connected, but your Snakiox could not be loaded yet.";
    } else if (ownedSnakes.length) {
      sourceText = `Connected wallet detected. Choose from ${ownedSnakes.length} owned Snakiox.`;
    } else if (loadedSnakesOnce) {
      sourceText =
        "Wallet connected, but no Snakiox were found in this wallet. Using presets for now.";
    }
  }

  return (
    <div className="pvp-setup-stack">
      <label className="pvp-field">
        <span className="pvp-field-label">Nickname</span>
        <input
          className="pvp-input"
          type="text"
          value={value.nickname}
          maxLength={20}
          disabled={disabled}
          onChange={(event) => setField("nickname", event.target.value)}
          placeholder="Enter nickname"
        />
      </label>

      <div className="pvp-summary-box">
        <div
          className="flex-between"
          style={{ gap: "0.8rem", flexWrap: "wrap" }}
        >
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>
              Snake Source
            </h3>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              {sourceText}
            </p>
          </div>
          {address && (
            <button
              className="pix-btn pix-btn--ghost"
              type="button"
              onClick={reloadSnakes}
              disabled={disabled || loadingSnakes}
            >
              {loadingSnakes ? "Loading..." : "Reload"}
            </button>
          )}
        </div>
        {loadError && <p className="pvp-error">{loadError}</p>}
      </div>

      <section>
        <div className="flex-between" style={{ marginBottom: "0.8rem" }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            Choose Snake
          </h3>
          <span className="tag">
            {ownedSnakes.length ? `Wallet · ${ownedSnakes.length}` : "Presets"}
          </span>
        </div>
        <div className="pvp-choice-scroll">
          <div className="pvp-loadout-grid">
            {snakeChoices.map((snake) => {
              const isSelected =
                String(value.snakeId) === String(snake.tokenId);
              return (
                <button
                  key={snake.tokenId}
                  type="button"
                  className={`pvp-choice-card ${isSelected ? "pvp-choice-card--active" : ""}`}
                  onClick={() => selectSnake(snake)}
                  disabled={disabled}
                >
                  <div className="pvp-choice-visual">
                    <SnakeAvatar
                      token={snake}
                      len={16}
                      stepRate={isSelected ? 6 : 2}
                    />
                  </div>
                  <div className="pvp-choice-body">
                    <strong>{snake.name}</strong>
                    <span>{snake.traits.skin}</span>
                    <span className="tag">{snake.traits.rarity}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="flex-between" style={{ marginBottom: "0.8rem" }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            Choose Background
          </h3>
          <span className="tag">Private board skin</span>
        </div>
        <div className="pvp-choice-scroll pvp-choice-scroll--backgrounds">
          <div className="pvp-loadout-grid pvp-loadout-grid--backgrounds">
            {BACKGROUNDS.map((background) => (
              <button
                key={background.id}
                type="button"
                className={`pvp-choice-card ${value.backgroundId === background.id ? "pvp-choice-card--active" : ""}`}
                onClick={() => setField("backgroundId", background.id)}
                disabled={disabled}
              >
                <div className="pvp-choice-visual pvp-choice-visual--background">
                  <BgThumb background={background} />
                </div>
                <div className="pvp-choice-body">
                  <strong>{background.name}</strong>
                  <span>{background.blurb}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
