import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import SnakeAvatar from "../SnakeAvatar";
import {
  BACKGROUNDS,
  createSnakeSnapshot,
  getSnakeChoices,
  getSnakeById,
} from "../../lib/pvpCatalog";
import { useWallet } from "../../lib/walletContext";

/* ── Background coil canvas ─────────────────────────────────────────────────── */
function BgCoilCanvas({ background }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width || 160));
    const h = Math.max(1, Math.round(rect.height || 80));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    background.paint(ctx, w, h, 12);
  }, [background]);
  return <canvas ref={ref} className="bg-coil-canvas" />;
}

/* ── Snake Carousel ─────────────────────────────────────────────────────────── */
function PvpSnakeCarousel({ snakeChoices, selectedSnakeId, onSelect, disabled }) {
  const idx = Math.max(0, snakeChoices.findIndex((s) => String(s.tokenId) === String(selectedSnakeId)));
  const [current, setCurrent] = useState(idx);
  const touchStartX = useRef(null);

  useEffect(() => {
    const i = snakeChoices.findIndex((s) => String(s.tokenId) === String(selectedSnakeId));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i >= 0 && i !== current) setCurrent(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSnakeId]);

  const go = useCallback(
    (next) => {
      if (disabled) return;
      const clamped = Math.max(0, Math.min(snakeChoices.length - 1, next));
      setCurrent(clamped);
      onSelect(snakeChoices[clamped]);
    },
    [snakeChoices, onSelect, disabled],
  );

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  if (!snakeChoices.length) return null;
  const snake = snakeChoices[current];

  return (
    <div className="snake-carousel">
      <button
        className="carousel-arrow carousel-arrow--prev"
        onClick={() => go(current - 1)}
        disabled={disabled || current === 0}
        aria-label="Previous snake"
        type="button"
      >◀</button>

      <div className="carousel-track" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="carousel-card">
          <div className="carousel-art">
            <SnakeAvatar token={snake} len={16} stepRate={6} />
          </div>
          <div className="carousel-meta">
            <span className="carousel-name">{snake.name}</span>
            <span className="carousel-skin">{snake.traits.skin}</span>
            <span className="tag">{snake.traits.rarity}</span>
          </div>
        </div>
      </div>

      <button
        className="carousel-arrow carousel-arrow--next"
        onClick={() => go(current + 1)}
        disabled={disabled || current === snakeChoices.length - 1}
        aria-label="Next snake"
        type="button"
      >▶</button>

      <div className="carousel-dots">
        {snakeChoices.map((s, i) => (
          <button
            key={s.tokenId}
            type="button"
            className={`carousel-dot${i === current ? " carousel-dot--active" : ""}`}
            onClick={() => go(i)}
            disabled={disabled}
            aria-label={`Select snake ${i + 1}`}
          />
        ))}
      </div>

      <p className="carousel-counter">{current + 1} / {snakeChoices.length}</p>
    </div>
  );
}

/* ── Background coil picker ─────────────────────────────────────────────────── */
function BgCoilPicker({ bgId, onChange, disabled }) {
  return (
    <div className="bg-coil-rail-wrap">
      <div className="bg-coil-rail">
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`bg-coil-item${b.id === bgId ? " bg-coil-item--selected" : ""}`}
            onClick={() => !disabled && onChange(b.id)}
            disabled={disabled}
            title={b.blurb}
          >
            <BgCoilCanvas background={b} />
            <div className="bg-coil-name">{b.name}</div>
            {b.id === bgId && <div className="bg-coil-selected-badge">✓</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── LoadoutForm ─────────────────────────────────────────────────────────────── */
export default function LoadoutForm({ value, onChange, disabled = false }) {
  const {
    address,
    snakes: ownedSnakes,
    loadingSnakes,
    loadError,
    loadedSnakesOnce,
    reloadSnakes,
  } = useWallet();

  const snakeChoices = useMemo(() => getSnakeChoices(ownedSnakes), [ownedSnakes]);
  const selectedSnake = getSnakeById(value.snakeId, snakeChoices);

  useEffect(() => {
    if (!selectedSnake) return;
    const hasSelected = snakeChoices.some(
      (snake) => String(snake.tokenId) === String(value.snakeId),
    );
    const nextSnake = hasSelected ? selectedSnake : snakeChoices[0];
    const nextSnapshot = createSnakeSnapshot(nextSnake);
    const snapshotChanged = JSON.stringify(value.snake) !== JSON.stringify(nextSnapshot);
    if (!hasSelected || snapshotChanged) {
      onChange({ ...value, snakeId: nextSnake.tokenId, snake: nextSnapshot });
    }
  }, [onChange, selectedSnake, snakeChoices, value]);

  const setField = (field, nextValue) => onChange({ ...value, [field]: nextValue });
  const selectSnake = (snake) =>
    onChange({ ...value, snakeId: snake.tokenId, snake: createSnakeSnapshot(snake) });

  let sourceText = "No wallet connected. Using preset snakes until you connect.";
  if (address) {
    if (loadingSnakes && !loadedSnakesOnce) sourceText = "Loading wallet snakes…";
    else if (loadError) sourceText = "Wallet connected, but your Snakiox could not be loaded.";
    else if (ownedSnakes.length) sourceText = `Wallet connected · ${ownedSnakes.length} Snakiox found.`;
    else if (loadedSnakesOnce) sourceText = "Wallet connected, but no Snakiox found. Using presets.";
  }

  return (
    <div className="pvp-setup-stack">
      {/* Nickname */}
      <label className="pvp-field">
        <span className="pvp-field-label">Nickname</span>
        <input
          className="pvp-input"
          type="text"
          value={value.nickname}
          maxLength={20}
          disabled={disabled}
          onChange={(e) => setField("nickname", e.target.value)}
          placeholder="Enter nickname"
        />
      </label>

      {/* Source info */}
      <div className="pvp-summary-box">
        <div className="flex-between" style={{ gap: "0.8rem", flexWrap: "wrap" }}>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>Snake Source</h3>
            <p className="muted" style={{ margin: "0.3rem 0 0", fontSize: "0.84rem" }}>{sourceText}</p>
          </div>
          {address && (
            <button
              className="pix-btn pix-btn--ghost"
              type="button"
              onClick={reloadSnakes}
              disabled={disabled || loadingSnakes}
            >
              {loadingSnakes ? "Loading…" : "Reload"}
            </button>
          )}
        </div>
        {loadError && <p className="pvp-error">{loadError}</p>}
      </div>

      {/* Snake carousel */}
      <section>
        <div className="flex-between" style={{ marginBottom: "0.7rem" }}>
          <h3 className="section-title" style={{ margin: 0 }}>Choose Snake</h3>
          <span className="tag">{ownedSnakes.length ? `Wallet · ${ownedSnakes.length}` : "Presets"}</span>
        </div>
        <PvpSnakeCarousel
          snakeChoices={snakeChoices}
          selectedSnakeId={value.snakeId}
          onSelect={selectSnake}
          disabled={disabled}
        />
      </section>

      {/* Background coil picker */}
      <section>
        <div className="flex-between" style={{ marginBottom: "0.7rem" }}>
          <h3 className="section-title" style={{ margin: 0 }}>Choose Background</h3>
          <span className="tag">Board skin</span>
        </div>
        <BgCoilPicker
          bgId={value.backgroundId}
          onChange={(id) => setField("backgroundId", id)}
          disabled={disabled}
        />
      </section>
    </div>
  );
}
