import { useEffect, useRef, useState, useCallback } from "react";
import { BACKGROUNDS, getBackground } from "../snakiox/backgrounds";
import { rarityClass } from "../lib/helpers";
import { openseaTokenUrl, shortAddress } from "../snakiox/chain";
import SnakeAvatar from "./SnakeAvatar";

/* ── Background coil canvas ─────────────────────────────────────────────────── */
function BgCoilCanvas({ bg, size = 10 }) {
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
    bg.paint(ctx, w, h, size);
  }, [bg, size]);
  return <canvas ref={ref} className="bg-coil-canvas" />;
}

/* ── Snake Carousel ─────────────────────────────────────────────────────────── */
function SnakeCarousel({ snakes, selectedId, onSelect }) {
  const idx = Math.max(0, snakes.findIndex((s) => s.tokenId === selectedId));
  const [current, setCurrent] = useState(idx);
  const touchStartX = useRef(null);

  useEffect(() => {
    const i = snakes.findIndex((s) => s.tokenId === selectedId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i >= 0 && i !== current) setCurrent(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const go = useCallback(
    (next) => {
      const clamped = Math.max(0, Math.min(snakes.length - 1, next));
      setCurrent(clamped);
      onSelect(snakes[clamped]);
    },
    [snakes, onSelect],
  );

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  if (!snakes.length) return null;
  const snake = snakes[current];

  return (
    <div className="snake-carousel">
      <button
        className="carousel-arrow carousel-arrow--prev"
        onClick={() => go(current - 1)}
        disabled={current === 0}
        aria-label="Previous snake"
        type="button"
      >◀</button>

      <div className="carousel-track" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="carousel-card">
          <div className="carousel-art">
            <SnakeAvatar token={snake} stepRate={6} />
          </div>
          <div className="carousel-meta">
            <span className="carousel-name">{snake.name}</span>
            <span className="carousel-skin">{snake.traits.skin}</span>
            <span className={`rarity-tag ${rarityClass(snake.traits.rarity)}`}>
              {snake.traits.rarity}
            </span>
          </div>
        </div>
      </div>

      <button
        className="carousel-arrow carousel-arrow--next"
        onClick={() => go(current + 1)}
        disabled={current === snakes.length - 1}
        aria-label="Next snake"
        type="button"
      >▶</button>

      <div className="carousel-dots">
        {snakes.map((s, i) => (
          <button
            key={s.tokenId}
            type="button"
            className={`carousel-dot${i === current ? " carousel-dot--active" : ""}`}
            onClick={() => go(i)}
            aria-label={`Select snake ${i + 1}`}
          />
        ))}
      </div>

      <p className="carousel-counter">{current + 1} / {snakes.length}</p>
    </div>
  );
}

/* ── Background coil picker ─────────────────────────────────────────────────── */
function BgCoilPicker({ bgId, onChange }) {
  return (
    <div className="bg-coil-rail-wrap">
      <div className="bg-coil-rail">
        {BACKGROUNDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`bg-coil-item${b.id === bgId ? " bg-coil-item--selected" : ""}`}
            onClick={() => onChange(b.id)}
            title={b.blurb}
          >
            <BgCoilCanvas bg={b} size={10} />
            <div className="bg-coil-name">{b.name}</div>
            {b.id === bgId && <div className="bg-coil-selected-badge">✓</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main SnakeSelect ────────────────────────────────────────────────────────── */
export default function SnakeSelect({
  address,
  snakes,
  loading,
  error,
  onReload,
  initialSnakeId,
  initialBgId,
  onStart,
  onBack,
}) {
  const [snakeId, setSnakeId] = useState(initialSnakeId ?? snakes[0]?.tokenId);
  const [bgId, setBgId] = useState(initialBgId ?? BACKGROUNDS[0].id);

  const selectedId = snakes.some((s) => s.tokenId === snakeId)
    ? snakeId
    : snakes[0]?.tokenId;

  const header = (
    <>
      <div className="flex-between" style={{ marginBottom: "1.2rem" }}>
        <button className="pix-btn pix-btn--ghost" onClick={onBack}>← Arcade</button>
        <div className="tag">Classic Coil · Setup</div>
      </div>
      <header className="page-head">
        <p className="page-eyebrow">{address ? shortAddress(address) : "Your collection"}</p>
        <h1 className="page-title">Choose your serpent</h1>
        <p className="page-sub">
          Swipe or tap arrows to pick your Snakiox, then choose a backdrop and start the run.
        </p>
      </header>
    </>
  );

  if (loading) {
    return (
      <div className="page">
        {header}
        <div className="pvp-loading-state">
          <span className="spinner" />
          <span>Reading your Snakiox from the chain…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        {header}
        <div className="pvp-summary-box" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 1rem" }}>{error}</p>
          <button className="pix-btn pix-btn--phosphor" onClick={onReload}>↻ Retry</button>
        </div>
      </div>
    );
  }

  if (!snakes.length) {
    return (
      <div className="page">
        {header}
        <div className="pvp-summary-box" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 0.4rem", fontWeight: 700 }}>No Snakiox in this wallet yet.</p>
          <p className="faint" style={{ margin: "0 0 1.2rem" }}>
            Mint a Snakiox to get a playable serpent.
          </p>
          <button className="pix-btn pix-btn--phosphor" onClick={onReload}>↻ Reload collection</button>
        </div>
      </div>
    );
  }

  const snake = snakes.find((s) => s.tokenId === selectedId) ?? snakes[0];
  const bg = getBackground(bgId);
  const t = snake.traits;

  return (
    <div className="page">
      {header}

      <div className="select-layout-v2">
        {/* Snake carousel */}
        <section className="select-section">
          <div className="flex-between" style={{ marginBottom: "0.8rem" }}>
            <h3 className="section-title" style={{ margin: 0 }}>Your Snakiox ({snakes.length})</h3>
            <button className="pix-btn pix-btn--ghost" onClick={onReload}>↻ Reload</button>
          </div>
          <SnakeCarousel
            snakes={snakes}
            selectedId={selectedId}
            onSelect={(tk) => setSnakeId(tk.tokenId)}
          />

          {/* Stat panel below carousel */}
          <div className="panel pvp-panel-pad" style={{ marginTop: "0.9rem" }}>
            <dl className="pvp-meta-list">
              <div><dt>Skin</dt><dd>{t.skin}</dd></div>
              <div><dt>Form</dt><dd>{t.form}</dd></div>
              <div><dt>Gaze</dt><dd>{t.gaze}</dd></div>
              <div><dt>Rarity</dt><dd><span className={`rarity-tag ${rarityClass(t.rarity)}`}>{t.rarity}</span></dd></div>
              <div><dt>Series</dt><dd>{t.skinSeries}</dd></div>
              <div><dt>Mark</dt><dd>{t.mark}</dd></div>
            </dl>
            <a
              className="tag link"
              href={openseaTokenUrl(snake.tokenId)}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block", marginTop: "0.6rem" }}
            >
              View on OpenSea ↗
            </a>
          </div>
        </section>

        {/* Background coil picker */}
        <section className="select-section">
          <div className="flex-between" style={{ marginBottom: "0.8rem" }}>
            <h3 className="section-title" style={{ margin: 0 }}>Background</h3>
            <span className="tag">{bg.name}</span>
          </div>
          <BgCoilPicker bgId={bgId} onChange={setBgId} />
          <div className="pvp-summary-box" style={{ marginTop: "0.65rem" }}>
            <p className="faint" style={{ fontSize: "0.82rem", lineHeight: 1.5, margin: 0 }}>
              {bg.blurb}
            </p>
          </div>
        </section>

        {/* Start button — sticky at bottom */}
        <button
          className="pix-btn pix-btn--phosphor pix-btn--lg pix-btn--block select-start-btn"
          onClick={() => onStart({ snake, bg })}
        >
          ▶ Start Run
        </button>
      </div>
    </div>
  );
}
